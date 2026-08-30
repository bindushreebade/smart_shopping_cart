export type ProductImportRow = {
  name: string;
  category: string;
  price: number;
  stock: number;
  aisle: string;
  shelf: string;
  reorderLevel: number;
  rfidTag?: string;
};

const FIELD_ALIASES: Record<string, string> = {
  product_id: "productId",
  vendor_id: "vendorId",
  product_name: "name",
  productname: "name",
  product: "name",
  name: "name",
  category: "category",
  product_category: "category",
  price: "price",
  selling_price: "price",
  sale_price: "price",
  unit_price: "price",
  mrp: "price",
  stock: "stock",
  stock_quantity: "stock",
  quantity: "stock",
  qty: "stock",
  units: "stock",
  available_stock: "stock",
  aisle: "aisle",
  aisle_no: "aisle",
  shelf: "shelf",
  shelf_no: "shelf",
  reorderlevel: "reorderLevel",
  reorder_level: "reorderLevel",
  reorder: "reorderLevel",
  minimum_stock: "reorderLevel",
  rfid: "rfidTag",
  rfid_tag: "rfidTag",
  rfidtag: "rfidTag",
  tag: "rfidTag",
};

export function normalizeProductRow(input: Record<string, any>): ProductImportRow {
  const normalized: Record<string, any> = {};

  for (const [rawKey, value] of Object.entries(input)) {
    const key = (rawKey || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    const mapped = FIELD_ALIASES[key] || key;
    normalized[mapped] = value;
  }

  const name = String(normalized.name ?? "").trim();
  const category = String(normalized.category ?? "General").trim() || "General";
  const price = Number(normalized.price ?? normalized.unit_price ?? 0);
  const stock = Number(normalized.stock ?? normalized.stock_quantity ?? normalized.quantity ?? 0);
  const aisle = String(normalized.aisle ?? "A").trim() || "A";
  const shelf = String(normalized.shelf ?? "1").trim() || "1";
  const reorderLevel = Number(normalized.reorderLevel ?? normalized.reorder_level ?? 10);

  if (!name) {
    throw new Error("Each product row must include a product name");
  }

  return {
    name,
    category,
    price: Number.isFinite(price) ? price : 0,
    stock: Number.isFinite(stock) ? stock : 0,
    aisle,
    shelf,
    reorderLevel: Number.isFinite(reorderLevel) ? reorderLevel : 10,
    rfidTag: normalized.rfidTag || normalized.rfid_tag || normalized.rfid || `RFID-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  };
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

export function parseCsvText(csvText: string): Record<string, any>[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((header) => header.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line).map((value) => value.trim().replace(/^"|"$/g, ""));
    return headers.reduce((acc, header, idx) => {
      acc[header] = values[idx] ?? "";
      return acc;
    }, {} as Record<string, string>);
  });

  return rows.filter((row) => Object.values(row).some((value) => String(value).trim() !== ""));
}

export function dedupeProductRows(rows: ProductImportRow[]): ProductImportRow[] {
  const seen = new Set<string>();

  return rows.filter((row) => {
    const key = [
      row.name.trim().toLowerCase(),
      row.category.trim().toLowerCase(),
      String(row.price),
      String(row.stock),
      row.aisle.trim().toLowerCase(),
      row.shelf.trim().toLowerCase(),
      String(row.reorderLevel),
    ].join("::");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
