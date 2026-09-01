import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "smartshop-super-secret-key";

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "smartshop",
  waitForConnections: true,
  connectionLimit: 10,
};

const pool = mysql.createPool(DB_CONFIG);

app.use(cors());
app.use(express.json());

function createToken(user) {
  return jwt.sign(
    {
      id: user.vendor_id,
      username: user.username,
      vendorId: user.vendor_id,
      role: user.role || "vendor_admin",
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function vendorAccess(req, res, next) {
  const user = req.user;
  const vendorIdFromUrl = Number(req.params.vendorId || req.query.vendorId);

  if (!user) return res.status(401).json({ message: "Unauthorized" });
  if (user.role === "super_admin") return next();

  if (!vendorIdFromUrl) {
    return res.status(400).json({ message: "Vendor ID is required" });
  }

  if (user.vendorId !== vendorIdFromUrl) {
    return res.status(403).json({ message: "This vendor account cannot access that workspace" });
  }

  next();
}

async function initDatabase() {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS vendors (
        vendor_id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        store_name VARCHAR(150) NOT NULL,
        location VARCHAR(255),
        number_of_carts INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS carts (
        cart_id INT AUTO_INCREMENT PRIMARY KEY,
        vendor_id INT NOT NULL,
        cart_number INT NOT NULL,
        status ENUM('active','inactive','maintenance') DEFAULT 'active',
        last_seen TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        product_id INT AUTO_INCREMENT PRIMARY KEY,
        vendor_id INT NOT NULL,
        name VARCHAR(150) NOT NULL,
        category VARCHAR(100),
        price DECIMAL(10,2) NOT NULL,
        stock_quantity INT DEFAULT 0,
        rfid_tag VARCHAR(100) UNIQUE,
        aisle VARCHAR(20),
        shelf VARCHAR(20),
        reorder_level INT DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id)
      )
    `);

    const [productColumns] = await connection.query("SHOW COLUMNS FROM products LIKE 'created_at'");
    if (!productColumns.length) {
      await connection.query("ALTER TABLE products ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    }

    const [cartColumns] = await connection.query("SHOW COLUMNS FROM carts LIKE 'created_at'");
    if (!cartColumns.length) {
      await connection.query("ALTER TABLE carts ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        order_id INT AUTO_INCREMENT PRIMARY KEY,
        vendor_id INT NOT NULL,
        cart_id INT,
        total_amount DECIMAL(10,2) NOT NULL,
        payment_status VARCHAR(30) DEFAULT 'paid',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id),
        FOREIGN KEY (cart_id) REFERENCES carts(cart_id)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        order_item_id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(order_id),
        FOREIGN KEY (product_id) REFERENCES products(product_id)
      )
    `);

    const [rows] = await connection.query("SELECT vendor_id FROM vendors WHERE username = ?", ["admin@smartshop.local"]);
    if (!rows.length) {
      const passwordHash = await bcrypt.hash("admin123", 10);
      const [result] = await connection.query(
        "INSERT INTO vendors (username, password_hash, store_name, location) VALUES (?, ?, ?, ?)",
        ["admin@smartshop.local", passwordHash, "SmartShop Default Vendor", "HQ"],
      );

      const vendorId = result.insertId;
      await connection.query(
        "INSERT INTO carts (vendor_id, cart_number, status, last_seen, created_at) VALUES (?, ?, 'active', NOW(), NOW())",
        [vendorId, 1],
      );
    }
  } finally {
    connection.release();
  }
}

async function ensureVendorCartRecords(vendorId, count = 1) {
  const safeCount = Math.max(1, Number(count || 1));
  const [existing] = await pool.query("SELECT COUNT(*) AS count FROM carts WHERE vendor_id = ?", [vendorId]);
  const existingCount = Number(existing[0]?.count || 0);

  if (existingCount >= safeCount) {
    return;
  }

  for (let cartNumber = existingCount + 1; cartNumber <= safeCount; cartNumber += 1) {
    await pool.query(
      "INSERT INTO carts (vendor_id, cart_number, status, last_seen, created_at) VALUES (?, ?, 'active', NOW(), NOW())",
      [vendorId, cartNumber],
    );
  }
}

async function createOrder({ vendorId, cartId, totalAmount, paymentStatus, items }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      "INSERT INTO orders (vendor_id, cart_id, total_amount, payment_status) VALUES (?, ?, ?, ?)",
      [vendorId, cartId || null, Number(totalAmount || 0), paymentStatus || "paid"],
    );

    const orderId = result.insertId;

    if (Array.isArray(items)) {
      for (const item of items) {
        const productId = Number(item.product_id ?? item.productId);
        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.unit_price ?? item.unitPrice ?? 0);

        if (!productId || !Number.isInteger(quantity) || quantity <= 0) continue;

        const [stockResult] = await connection.query(
          "UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ? AND vendor_id = ? AND stock_quantity >= ?",
          [quantity, productId, vendorId, quantity],
        );

        if (stockResult.affectedRows === 0) {
          throw new Error("Insufficient stock for one or more products");
        }

        await connection.query(
          "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
          [orderId, productId, quantity, unitPrice],
        );
      }
    }

    if (cartId) {
      await connection.query(
        "UPDATE carts SET status = 'inactive', last_seen = NOW() WHERE cart_id = ? AND vendor_id = ?",
        [cartId, vendorId],
      );
    }

    const [rows] = await connection.query("SELECT * FROM orders WHERE order_id = ?", [orderId]);
    await connection.commit();
    return rows[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "SmartShop API is running" });
});

app.post("/api/admin/register", async (req, res) => {
  const { email, password, vendorName, location, numberOfCarts, role = "vendor_admin" } = req.body || {};

  if (!email || !password || !vendorName) {
    return res.status(400).json({ message: "Email, password, and vendor name are required" });
  }

  const username = String(email).trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 10);

  const [existing] = await pool.query("SELECT vendor_id FROM vendors WHERE username = ?", [username]);
  if (existing.length) {
    return res.status(409).json({ message: "Vendor already exists" });
  }

  const [result] = await pool.query(
    "INSERT INTO vendors (username, password_hash, store_name, location, number_of_carts) VALUES (?, ?, ?, ?, ?)",
    [username, passwordHash, vendorName, location || "", Number(numberOfCarts || 0)],
  );

  const vendorId = result.insertId;
  await ensureVendorCartRecords(vendorId, Number(numberOfCarts || 1));
  const user = {
    vendor_id: vendorId,
    username,
    role,
  };

  res.status(201).json({
    message: "Admin registered successfully",
    token: createToken(user),
    user: {
      id: vendorId,
      email: username,
      vendorId,
      role,
    },
  });
});

app.post("/api/admin/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const username = String(email).trim().toLowerCase();
  const [rows] = await pool.query("SELECT * FROM vendors WHERE username = ?", [username]);

  if (!rows.length) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const vendor = rows[0];
  const isPasswordValid = await bcrypt.compare(password, vendor.password_hash);
  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const user = {
    vendor_id: vendor.vendor_id,
    username: vendor.username,
    role: "vendor_admin",
  };

  res.json({
    token: createToken(user),
    user: {
      id: vendor.vendor_id,
      email: vendor.username,
      vendorId: vendor.vendor_id,
      role: "vendor_admin",
    },
  });
});

app.get("/api/admin/me", authMiddleware, async (req, res) => {
  const vendorId = Number(req.user.vendorId);
  const [rows] = await pool.query("SELECT vendor_id, username, store_name, location FROM vendors WHERE vendor_id = ?", [vendorId]);

  if (!rows.length) {
    return res.status(404).json({ message: "User not found" });
  }

  const vendor = rows[0];
  res.json({
    id: vendor.vendor_id,
    email: vendor.username,
    vendorId: vendor.vendor_id,
    role: "vendor_admin",
    storeName: vendor.store_name,
    location: vendor.location,
  });
});

app.get("/api/products", async (req, res) => {
  const vendorId = Number(req.query.vendorId || 1);
  const [rows] = await pool.query("SELECT * FROM products WHERE vendor_id = ? ORDER BY product_id DESC", [vendorId]);
  res.json(rows);
});

app.post("/api/carts", async (req, res) => {
  const { vendorId = 1, cartNumber = 1, status = "active" } = req.body || {};
  const safeVendorId = Number(vendorId || 1);
  const safeCartNumber = Number(cartNumber || 1);

  try {
    const [result] = await pool.query(
      "INSERT INTO carts (vendor_id, cart_number, status, last_seen, created_at) VALUES (?, ?, ?, NOW(), NOW())",
      [safeVendorId, safeCartNumber, status || "active"],
    );

    const [rows] = await pool.query("SELECT * FROM carts WHERE cart_id = ?", [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: "Could not create cart for this transaction", error: error.message });
  }
});

app.post("/api/orders", async (req, res) => {
  const { vendorId = 1, cartId, totalAmount, paymentStatus = "paid", items = [] } = req.body || {};
  const safeVendorId = Number(vendorId || 1);

  try {
    const order = await createOrder({ vendorId: safeVendorId, cartId, totalAmount, paymentStatus, items });
    return res.status(201).json(order);
  } catch (error) {
    return res.status(500).json({ message: "Could not save the order to the database", error: error.message });
  }
});

app.get("/api/vendor/:vendorId/products", authMiddleware, vendorAccess, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM products WHERE vendor_id = ? ORDER BY product_id DESC", [req.params.vendorId]);
  res.json(rows);
});

app.post("/api/vendor/:vendorId/products", authMiddleware, vendorAccess, async (req, res) => {
  const { name, price, stock, category, description, imageUrl, rfidTag, aisle, shelf, reorderLevel } = req.body || {};

  const [result] = await pool.query(
    "INSERT INTO products (vendor_id, name, category, price, stock_quantity, rfid_tag, aisle, shelf, reorder_level, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())",
    [req.params.vendorId, name, category || "general", Number(price), Number(stock || 0), rfidTag || `RFID-${Date.now()}`, aisle || "A", shelf || "1", Number(reorderLevel || 10)],
  );

  const productId = result.insertId;
  const [rows] = await pool.query("SELECT * FROM products WHERE product_id = ?", [productId]);
  res.status(201).json(rows[0]);
});

app.post("/api/vendor/:vendorId/products/bulk", authMiddleware, vendorAccess, async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : Array.isArray(req.body) ? req.body : [];

  if (!items.length) {
    return res.status(400).json({ message: "No product rows were supplied" });
  }

  const inserted = [];
  for (const item of items) {
    const name = String(item.name || "").trim();
    const category = String(item.category || "General").trim() || "General";
    const price = Number(item.price || 0);
    const stock = Number(item.stock || item.stock_quantity || 0);
    const aisle = String(item.aisle || "A").trim() || "A";
    const shelf = String(item.shelf || "1").trim() || "1";
    const hasReorderLevel = item.reorderLevel !== undefined && item.reorderLevel !== null && String(item.reorderLevel).trim() !== "";
    const reorderLevel = hasReorderLevel ? Number(item.reorderLevel) : Number(item.reorder_level);
    const rfidTag = item.rfidTag || item.rfid_tag || `RFID-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    if (!name) continue;

    const [existingRows] = await pool.query(
      "SELECT product_id FROM products WHERE vendor_id = ? AND LOWER(name) = LOWER(?) LIMIT 1",
      [req.params.vendorId, name],
    );

    if (existingRows.length) {
      const fields = ["stock_quantity = stock_quantity + ?"];
      const values = [stock];

      if (hasReorderLevel && Number.isFinite(reorderLevel)) {
        fields.push("reorder_level = ?");
        values.push(reorderLevel);
      }

      values.push(existingRows[0].product_id, req.params.vendorId);
      await pool.query(
        `UPDATE products SET ${fields.join(", ")} WHERE product_id = ? AND vendor_id = ?`,
        values,
      );

      const [rows] = await pool.query("SELECT * FROM products WHERE product_id = ?", [existingRows[0].product_id]);
      inserted.push(rows[0]);
      continue;
    }

    const [result] = await pool.query(
      "INSERT INTO products (vendor_id, name, category, price, stock_quantity, rfid_tag, aisle, shelf, reorder_level, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())",
      [req.params.vendorId, name, category, price, stock, rfidTag, aisle, shelf, hasReorderLevel && Number.isFinite(reorderLevel) ? reorderLevel : 10],
    );

    const [rows] = await pool.query("SELECT * FROM products WHERE product_id = ?", [result.insertId]);
    inserted.push(rows[0]);
  }

  res.status(201).json({ inserted, count: inserted.length });
});

app.get("/api/vendor/:vendorId/carts", authMiddleware, vendorAccess, async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM carts WHERE vendor_id = ? ORDER BY cart_number ASC",
    [req.params.vendorId],
  );
  res.json(rows);
});

app.get("/api/vendor/:vendorId/orders", authMiddleware, vendorAccess, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM orders WHERE vendor_id = ? ORDER BY created_at DESC", [req.params.vendorId]);
  res.json(rows);
});

app.post("/api/vendor/:vendorId/carts", authMiddleware, vendorAccess, async (req, res) => {
  const { cartNumber = 1, status = "active" } = req.body || {};
  const [result] = await pool.query(
    "INSERT INTO carts (vendor_id, cart_number, status, last_seen, created_at) VALUES (?, ?, ?, NOW(), NOW())",
    [req.params.vendorId, Number(cartNumber || 1), status || "active"],
  );

  const [rows] = await pool.query("SELECT * FROM carts WHERE cart_id = ?", [result.insertId]);
  res.status(201).json(rows[0]);
});

app.post("/api/vendor/:vendorId/orders", authMiddleware, vendorAccess, async (req, res) => {
  const { cartId, totalAmount, paymentStatus = "paid", items = [] } = req.body || {};

  try {
    const order = await createOrder({ vendorId: Number(req.params.vendorId), cartId, totalAmount, paymentStatus, items });
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message || "Could not save the order to the database" });
  }
});

app.get("/api/vendor/:vendorId/inventory", authMiddleware, vendorAccess, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM products WHERE vendor_id = ? ORDER BY product_id DESC", [req.params.vendorId]);
  res.json(rows);
});

app.put("/api/vendor/:vendorId/inventory/:productId", authMiddleware, vendorAccess, async (req, res) => {
  const updates = req.body || {};
  const fields = Object.entries(updates).filter(([, value]) => value !== undefined);

  if (!fields.length) {
    return res.status(400).json({ message: "No update data provided" });
  }

  const setClause = fields.map(([key]) => `${key} = ?`).join(", ");
  const values = fields.map(([, value]) => value);
  values.push(req.params.productId, req.params.vendorId);

  const [result] = await pool.query(
    `UPDATE products SET ${setClause} WHERE product_id = ? AND vendor_id = ?`,
    values,
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: "Inventory item not found" });
  }

  const [rows] = await pool.query("SELECT * FROM products WHERE product_id = ? AND vendor_id = ?", [req.params.productId, req.params.vendorId]);
  res.json(rows[0]);
});

app.listen(PORT, async () => {
  try {
    await initDatabase();
    console.log(`SmartShop backend running on http://localhost:${PORT}`);
    console.log(`MySQL connected: ${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`);
  } catch (error) {
    console.error("MySQL connection failed:", error.message);
    process.exit(1);
  }
});
