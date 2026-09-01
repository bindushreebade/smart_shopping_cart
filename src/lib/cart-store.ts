import { DEMO_PRODUCTS, type DemoProduct } from "@/lib/demo-products";

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "http://localhost:4000";
const CART_KEY = "smartcart.items";
const BUDGET_KEY = "smartcart.budget";
const INVENTORY_KEY = "smartcart.inventory";
const ORDERS_KEY = "smartcart.orders";
const ADMIN_TOKEN_KEY = "smartshop-admin-token";

function buildApiUrl(path: string, params?: Record<string, string | number | undefined>) {
  const url = new URL(path, `${API_BASE.replace(/\/$/, "")}/`);

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

export function getVendorStorageKey(baseKey: string, vendorId?: string): string {
  const resolvedVendorId = vendorId ?? getCurrentVendorId();
  return resolvedVendorId ? `${baseKey}.${resolvedVendorId}` : baseKey;
}

export function getCurrentVendorId(): string {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) return "1";

  try {
    const payload = token.split(".")[1];
    if (!payload) return "1";

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = JSON.parse(atob(padded));
    return decoded.vendorId || "1";
  } catch {
    return "1";
  }
}

async function hydrateInventoryFromDatabase(): Promise<DemoProduct[]> {
  const vendorId = getCurrentVendorId();

  try {
    const response = await fetch(buildApiUrl("/api/products", { vendorId }));
    if (!response.ok) return [];

    const rows = await response.json();
    const mapped = (rows || []).map((product: any) => ({
      id: String(product.product_id ?? product.id),
      name: product.name ?? "Unnamed product",
      price: Number(product.price ?? 0),
      stock: Number(product.stock_quantity ?? product.stock ?? 0),
      rfid_tag: product.rfid_tag ?? product.rfidTag ?? "",
      image_url: product.image_url ?? "",
      category: product.category ?? "General",
      description: product.description ?? "",
      aisle: Number(product.aisle?.match(/\d+/)?.[0] ?? 1),
      shelf: String(product.shelf ?? "1"),
    }));

    if (mapped.length) {
      writeJson(INVENTORY_KEY, mapped);
      emit(INVENTORY_EVENT);
    }

    return mapped;
  } catch {
    return [];
  }
}

export const TAX_RATE = 0.08;

export type CartEntry = {
  product_id: string;
  quantity: number;
};

export type CartItemRow = {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product?: DemoProduct;
};

export type OrderRow = {
  id: string;
  reference: string;
  subtotal: number;
  tax: number;
  total: number;
  payment_method: string;
  status: string;
  created_at: string;
  items: Array<{
    product_id: string;
    name: string;
    quantity: number;
    unit_price: number;
  }>;
};

const CART_EVENT = "smartcart:updated";
const INVENTORY_EVENT = "smartcart:inventory";
const ORDERS_EVENT = "smartcart:orders";
const BUDGET_EVENT = "smartcart:budget";

function emit(name: string) {
  window.dispatchEvent(new CustomEvent(name));
}

function cloneProducts(products: DemoProduct[]) {
  return products.map((product) => ({ ...product }));
}

function readJson<T>(key: string, fallback: T, vendorId?: string): T {
  const scopedKey = getVendorStorageKey(key, vendorId);
  try {
    const raw = localStorage.getItem(scopedKey);
    if (raw) return JSON.parse(raw) as T;

    if (scopedKey !== key) {
      const legacyRaw = localStorage.getItem(key);
      if (legacyRaw) return JSON.parse(legacyRaw) as T;
    }

    return fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T, vendorId?: string) {
  localStorage.setItem(getVendorStorageKey(key, vendorId), JSON.stringify(value));
}

export function getStoredBudget(): number {
  const value = localStorage.getItem(getVendorStorageKey(BUDGET_KEY));
  return value ? parseFloat(value) : 100;
}

export function setStoredBudget(value: number) {
  localStorage.setItem(getVendorStorageKey(BUDGET_KEY), String(value));
  emit(BUDGET_EVENT);
}

export function clearStoredCart() {
  writeJson(CART_KEY, [] as CartEntry[]);
  emit(CART_EVENT);
}

export async function ensureCartSession(): Promise<string> {
  await hydrateInventoryFromDatabase();
  ensureInventory();
  if (!localStorage.getItem(getVendorStorageKey(CART_KEY))) {
    writeJson(CART_KEY, [] as CartEntry[]);
  }
  return Promise.resolve("local-cart");
}

export function ensureInventory(): DemoProduct[] {
  const existing = readJson<DemoProduct[]>(INVENTORY_KEY, []);
  if (existing.length === 0) {
    return [];
  }

  return existing;
}

export function getInventoryProducts(): DemoProduct[] {
  return ensureInventory();
}

export function getProductById(productId: string): DemoProduct | undefined {
  return getInventoryProducts().find((product) => product.id === productId);
}

function getCartEntries(): CartEntry[] {
  return readJson<CartEntry[]>(CART_KEY, []);
}

function saveCartEntries(entries: CartEntry[]) {
  writeJson(CART_KEY, entries);
  emit(CART_EVENT);
}

export function saveInventoryProducts(products: DemoProduct[]) {
  writeJson(INVENTORY_KEY, products);
  emit(INVENTORY_EVENT);
}

export function appendInventoryProducts(products: DemoProduct[]) {
  const current = getInventoryProducts();
  const merged = [...current, ...products.filter((product) => !current.some((existing) => existing.id === product.id))];
  saveInventoryProducts(merged);
  return merged;
}

export function getStoredOrders(): OrderRow[] {
  return readJson<OrderRow[]>(ORDERS_KEY, []);
}

function saveOrders(orders: OrderRow[]) {
  writeJson(ORDERS_KEY, orders);
  emit(ORDERS_EVENT);
}

export function fetchCartItems(cartId: string): Promise<CartItemRow[]> {
  const inventory = getInventoryProducts();
  const rows = getCartEntries().flatMap((entry) => {
    const product = inventory.find((item) => item.id === entry.product_id);
    if (!product) return [];

    return [{
      id: `${cartId}-${entry.product_id}`,
      cart_id: cartId,
      product_id: entry.product_id,
      quantity: entry.quantity,
      unit_price: product.price,
      product,
    }];
  });

  return Promise.resolve(rows);
}

export function onCartChanged(handler: () => void) {
  window.addEventListener(CART_EVENT, handler);
  return () => window.removeEventListener(CART_EVENT, handler);
}

export function onInventoryChanged(handler: () => void) {
  window.addEventListener(INVENTORY_EVENT, handler);
  return () => window.removeEventListener(INVENTORY_EVENT, handler);
}

export function onOrdersChanged(handler: () => void) {
  window.addEventListener(ORDERS_EVENT, handler);
  return () => window.removeEventListener(ORDERS_EVENT, handler);
}

export async function addProductToCart(productId: string) {
  ensureCartSession();

  const product = getProductById(productId);
  if (!product) throw new Error("Product not found");

  const entries = getCartEntries();
  const existing = entries.find((entry) => entry.product_id === productId);
  const currentQuantity = existing?.quantity ?? 0;

  if (currentQuantity >= product.stock) {
    throw new Error(`${product.name} is out of stock in this cart`);
  }

  const nextEntries = existing
    ? entries.map((entry) =>
        entry.product_id === productId
          ? { ...entry, quantity: entry.quantity + 1 }
          : entry,
      )
    : [{ product_id: productId, quantity: 1 }, ...entries];

  saveCartEntries(nextEntries);
}

export async function updateQuantity(itemId: string, quantity: number) {
  const productId = itemId.replace(/^local-cart-/, "");
  const product = getProductById(productId);
  const entries = getCartEntries();

  if (quantity <= 0) {
    saveCartEntries(entries.filter((entry) => entry.product_id !== productId));
    return;
  }

  if (!product) throw new Error("Product not found");
  if (quantity > product.stock) {
    throw new Error(`Only ${product.stock} units of ${product.name} available`);
  }

  saveCartEntries(
    entries.map((entry) =>
      entry.product_id === productId ? { ...entry, quantity } : entry,
    ),
  );
}

export async function removeItem(itemId: string) {
  const productId = itemId.replace(/^local-cart-/, "");
  saveCartEntries(getCartEntries().filter((entry) => entry.product_id !== productId));
}

export function calcTotals(items: CartItemRow[]) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * Number(item.unit_price), 0);
  const tax = +(subtotal * TAX_RATE).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);
  return { subtotal: +subtotal.toFixed(2), tax, total };
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function checkoutCart(paymentMethod: string) {
  const items = await fetchCartItems("local-cart");
  if (items.length === 0) throw new Error("Cart is empty");

  const inventory = getInventoryProducts();

  for (const item of items) {
    const product = inventory.find((entry) => entry.id === item.product_id);
    if (!product || product.stock < item.quantity) {
      throw new Error(`Insufficient stock for ${item.product?.name ?? "item"}`);
    }
  }

  const totals = calcTotals(items);
  const vendorId = getCurrentVendorId();
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);

  const cartUrl = token
    ? buildApiUrl(`/api/vendor/${vendorId}/carts`)
    : buildApiUrl("/api/carts", { vendorId });

  const cartResponse = await fetch(cartUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(
      token
        ? { cartNumber: 1, status: "active" }
        : { vendorId, cartNumber: 1, status: "active" },
    ),
  });

  if (!cartResponse.ok) {
    const payload = await cartResponse.json().catch(() => ({}));
    throw new Error(payload.message || "Could not create cart for this transaction");
  }

  const cart = await cartResponse.json();

  const orderUrl = token
    ? buildApiUrl(`/api/vendor/${vendorId}/orders`)
    : buildApiUrl("/api/orders", { vendorId });

  const orderResponse = await fetch(orderUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(
      token
        ? {
            cartId: cart.cart_id,
            totalAmount: totals.total,
            paymentStatus: "paid",
            items: items.map((item) => ({
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
            })),
          }
        : {
            vendorId,
            cartId: cart.cart_id,
            totalAmount: totals.total,
            paymentStatus: "paid",
            items: items.map((item) => ({
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
            })),
          },
    ),
  });

  if (!orderResponse.ok) {
    const payload = await orderResponse.json().catch(() => ({}));
    throw new Error(payload.message || "Could not save the order to the database");
  }

  const orderPayload = await orderResponse.json();

  const updatedInventory = inventory.map((product) => {
    const item = items.find((cartItem) => cartItem.product_id === product.id);
    return item ? { ...product, stock: product.stock - item.quantity } : product;
  });

  const order: OrderRow = {
    id: String(orderPayload.order_id ?? makeId("txn")),
    reference: `TXN-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    subtotal: totals.subtotal,
    tax: totals.tax,
    total: totals.total,
    payment_method: paymentMethod,
    status: "completed",
    created_at: new Date().toISOString(),
    items: items.map((item) => ({
      product_id: item.product_id,
      name: item.product?.name ?? "Unknown item",
      quantity: item.quantity,
      unit_price: item.unit_price,
    })),
  };

  saveInventoryProducts(updatedInventory);
  saveOrders([order, ...getStoredOrders()]);
  setStoredBudget(0);
  clearStoredCart();

  return order;
}

export function getOrderById(id: string) {
  return getStoredOrders().find((order) => order.id === id) ?? null;
}
