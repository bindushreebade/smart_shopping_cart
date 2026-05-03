import { useEffect, useState } from "react";
import { Plus, Package } from "lucide-react";
import { motion } from "framer-motion";
import {
  addProductToCart,
  CartItemRow,
  getInventoryProducts,
  getStoredOrders,
  onInventoryChanged,
  onOrdersChanged,
} from "@/lib/cart-store";
import { toast } from "sonner";
import { ProductImage } from "@/components/ProductImage";
import { isBlockedProductName, normalizeProductName } from "@/lib/demo-products";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string | null;
  image_url: string | null;
  stock?: number;
  aisle?: number;
  shelf?: string;
}

const shuffle = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export function Recommendations({ items }: { items: CartItemRow[] }) {
  const [recs, setRecs] = useState<Product[]>([]);

  useEffect(() => {
    const load = () => {
      const inventory = getInventoryProducts().filter(
        (product) => !isBlockedProductName(product.name) && product.stock > 0,
      );
      const inventoryById = new Map(inventory.map((product) => [product.id, product]));
      const cartProductIds = new Set(items.map((item) => item.product_id));
      const orders = getStoredOrders();

      const scores = new Map<string, number>();

      if (cartProductIds.size > 0) {
        for (const order of orders) {
          const orderIds = new Set(order.items.map((item) => item.product_id));
          const hasCartMatch = [...cartProductIds].some((id) => orderIds.has(id));
          if (!hasCartMatch) continue;

          for (const orderItem of order.items) {
            if (cartProductIds.has(orderItem.product_id)) continue;
            scores.set(
              orderItem.product_id,
              (scores.get(orderItem.product_id) ?? 0) + orderItem.quantity,
            );
          }
        }
      } else {
        for (const order of orders) {
          for (const orderItem of order.items) {
            scores.set(
              orderItem.product_id,
              (scores.get(orderItem.product_id) ?? 0) + orderItem.quantity,
            );
          }
        }
      }

      let ranked = [...scores.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([productId]) => inventoryById.get(productId))
        .filter((product): product is typeof inventory[0] => Boolean(product));

      if (ranked.length < 6) {
        const seen = new Set(ranked.map((product) => product.id));
        const fallback = inventory
          .filter((product) => !seen.has(product.id))
          .sort((a, b) => b.stock - a.stock);
        ranked = [...ranked, ...fallback];
      }

      setRecs(shuffle(ranked).slice(0, 6));
    };

    load();
    const offInventory = onInventoryChanged(load);
    const offOrders = onOrdersChanged(load);
    return () => {
      offInventory();
      offOrders();
    };
  }, [items]);

  if (recs.length === 0) return null;

  return (
    <section className="rounded-2xl bg-card p-3 shadow-card md:p-4">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="font-display text-xl font-semibold text-dark-green md:text-2xl">
          {items.length ? "Frequently bought together" : "Popular picks"}
        </h2>
      </div>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto scrollbar-hide pb-2">
        {recs.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ y: -3 }}
            className="group flex min-w-[104px] w-[calc((100%-3rem)/5)] shrink-0 snap-start flex-col rounded-2xl border border-border bg-white p-2.5 shadow-card transition-all duration-300 hover:shadow-elev"
          >
            {(() => {
              const productName = normalizeProductName(p.name);
              return (
                <>
                  <div className="mb-2 flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-surface-green">
                    <ProductImage
                      imageUrl={p.image_url}
                      name={productName}
                      category={p.category}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      fallback={<Package className="h-8 w-8 text-dark-green/50" />}
                    />
                  </div>
                  <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-dark-green">{productName}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{p.category}</p>
                  {(p.aisle !== undefined || p.shelf !== undefined) && (
                    <p className="mt-1 text-[9px] text-muted-foreground">
                      {p.aisle !== undefined && <span>Aisle {p.aisle}</span>}
                      {p.aisle !== undefined && p.shelf && <span> • </span>}
                      {p.shelf && <span className="capitalize">{p.shelf}</span>}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center justify-between gap-1">
                    <span className="font-display text-xs font-bold tabular-nums text-dark-green">${Number(p.price).toFixed(2)}</span>
                    <button
                      onClick={async () => {
                        await addProductToCart(p.id);
                        toast.success(`Added ${productName}`);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft transition-transform active:scale-90 hover:scale-105"
                      aria-label={`Add ${productName}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              );
            })()}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
