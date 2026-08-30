import { describe, it, expect, beforeEach } from "vitest";
import { getVendorStorageKey } from "@/lib/cart-store";

beforeEach(() => {
  localStorage.clear();
});

describe("vendor-scoped admin data", () => {
  it("creates different storage keys for different vendor accounts", () => {
    const vendorA = "vendor-1";
    const vendorB = "vendor-2";

    expect(getVendorStorageKey("smartcart.inventory", vendorA)).toBe("smartcart.inventory.vendor-1");
    expect(getVendorStorageKey("smartcart.inventory", vendorB)).toBe("smartcart.inventory.vendor-2");
  });

  it("stores each vendor's data in its own local storage bucket", () => {
    const vendorAKey = getVendorStorageKey("smartcart.inventory", "vendor-1");
    const vendorBKey = getVendorStorageKey("smartcart.inventory", "vendor-2");

    localStorage.setItem(vendorAKey, JSON.stringify([{ id: "p1", name: "A Product", stock: 6, price: 100, category: "home" }]));
    localStorage.setItem(vendorBKey, JSON.stringify([{ id: "p2", name: "B Product", stock: 2, price: 180, category: "tech" }]));

    expect(JSON.parse(localStorage.getItem(vendorAKey) || "[]")[0].name).toBe("A Product");
    expect(JSON.parse(localStorage.getItem(vendorBKey) || "[]")[0].name).toBe("B Product");
    expect(localStorage.getItem("smartcart.inventory")).toBeNull();
  });
});
