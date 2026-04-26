import { DEMO_PRODUCTS, type DemoProduct } from "@/lib/demo-products";

const CART_KEY = "smartcart.items";
const BUDGET_KEY = "smartcart.budget";
const INVENTORY_KEY = "smartcart.inventory";
const ORDERS_KEY = "smartcart.orders";

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

function emit(name: string) {
  window.dispatchEvent(new CustomEvent(name));
}

function cloneProducts(products: DemoProduct[]) {
  return products.map((product) => ({ ...product }));
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getStoredBudget(): number {
  const value = localStorage.getItem(BUDGET_KEY);
  return value ? parseFloat(value) : 100;
}

export function setStoredBudget(value: number) {
  localStorage.setItem(BUDGET_KEY, String(value));
}

export function clearStoredCart() {
  writeJson(CART_KEY, [] as CartEntry[]);
  emit(CART_EVENT);
}

export function ensureCartSession(): Promise<string> {
  ensureInventory();
  if (!localStorage.getItem(CART_KEY)) {
    writeJson(CART_KEY, [] as CartEntry[]);
  }
  return Promise.resolve("local-cart");
}

export function ensureInventory(): DemoProduct[] {
  const existing = readJson<DemoProduct[]>(INVENTORY_KEY, []);
  if (existing.length === 0) {
    const seeded = cloneProducts(DEMO_PRODUCTS);
    writeJson(INVENTORY_KEY, seeded);
    return seeded;
  }

  const merged = DEMO_PRODUCTS.map((product) => {
    const saved = existing.find((entry) => entry.id === product.id);
    return saved ? { ...product, stock: saved.stock } : { ...product };
  });

  if (merged.length !== existing.length || merged.some((product, index) => {
    const saved = existing[index];
    return !saved || saved.id !== product.id || saved.stock !== product.stock;
  })) {
    writeJson(INVENTORY_KEY, merged);
  }

  return merged;
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

function saveInventoryProducts(products: DemoProduct[]) {
  writeJson(INVENTORY_KEY, products);
  emit(INVENTORY_EVENT);
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

  const updatedInventory = inventory.map((product) => {
    const item = items.find((cartItem) => cartItem.product_id === product.id);
    return item ? { ...product, stock: product.stock - item.quantity } : product;
  });

  const totals = calcTotals(items);
  const order: OrderRow = {
    id: makeId("txn"),
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
  clearStoredCart();

  return order;
}

export function getOrderById(id: string) {
  return getStoredOrders().find((order) => order.id === id) ?? null;
}
