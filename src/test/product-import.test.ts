import { describe, expect, it } from "vitest";
import { dedupeProductRows, normalizeProductRow, parseCsvText } from "@/lib/product-import";

describe("product import helpers", () => {
  it("normalizes csv-like product columns", () => {
    const row = normalizeProductRow({
      product_name: "Rice",
      category: "Groceries",
      price: "120",
      stock_quantity: "42",
      aisle: "A1",
      shelf: "2",
      reorder_level: "10",
    });

    expect(row.name).toBe("Rice");
    expect(row.category).toBe("Groceries");
    expect(row.price).toBe(120);
    expect(row.stock).toBe(42);
    expect(row.aisle).toBe("A1");
    expect(row.shelf).toBe("2");
    expect(row.reorderLevel).toBe(10);
  });

  it("parses a valid csv string into product rows", () => {
    const rows = parseCsvText(`name,category,price,stock,aisle,shelf,reorderLevel\nMilk,Dairy,80,24,A1,3,10\nBread,Bakery,45,15,B2,1,5`);

    expect(rows).toHaveLength(2);
    expect(rows[0].name).toBe("Milk");
    expect(rows[1].category).toBe("Bakery");
  });

  it("accepts the real database-style csv headers", () => {
    const rows = parseCsvText(`product_id,vendor_id,name,category,price,stock_quantity,rfid_tag,aisle,shelf,reorder_level\n1,1,Amul Taaza Milk 1L,Dairy,68.0,100,RFID001,A1,S1,20\n2,1,Britannia Bread 400g,Bakery,45.0,75,RFID002,A2,S2,15`);

    const normalized = rows.map((row) => normalizeProductRow(row));

    expect(normalized).toHaveLength(2);
    expect(normalized[0].name).toBe("Amul Taaza Milk 1L");
    expect(normalized[0].price).toBe(68);
    expect(normalized[0].stock).toBe(100);
    expect(normalized[0].reorderLevel).toBe(20);
    expect(normalized[0].rfidTag).toContain("RFID001");
  });

  it("removes duplicate products from the same csv import", () => {
    const rows = [
      { name: "Rice", category: "Groceries", price: "120", stock: "42", aisle: "A1", shelf: "2", reorderLevel: "10" },
      { name: "Rice", category: "Groceries", price: "120", stock: "42", aisle: "A1", shelf: "2", reorderLevel: "10" },
      { name: "Milk", category: "Dairy", price: "80", stock: "24", aisle: "B1", shelf: "3", reorderLevel: "12" },
    ];

    const deduped = dedupeProductRows(rows.map((row) => normalizeProductRow(row)));

    expect(deduped).toHaveLength(2);
    expect(deduped.map((row) => row.name)).toEqual(["Rice", "Milk"]);
  });
});
