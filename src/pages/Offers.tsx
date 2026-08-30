import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Tag, Flame, Clock, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { addProductToCart, getInventoryProducts, onInventoryChanged } from "@/lib/cart-store";
import { toast } from "sonner";
import { ProductImage } from "@/components/ProductImage";
import { isBlockedProductName, normalizeProductName } from "@/lib/demo-products";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string | null;
  image_url: string | null;
}

const banners = [
  { title: "Mega weekend sale", sub: "Up to 30% off fresh produce", tag: "Today only", emoji: "Fresh" },
  { title: "Buy 2, get 1 free", sub: "On all bakery items", tag: "Limited", emoji: "Bake" },
  { title: "Snack stack", sub: "Flat ₹5 off snack bundles over ₹20", tag: "This week", emoji: "Snack" },
];

export default function Offers() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const load = () => {
      const inventory = getInventoryProducts()
        .filter((product) => !isBlockedProductName(product.name) && product.stock > 0)
        .sort((a, b) => a.price - b.price)
        .slice(0, 8);
      setProducts(inventory);
    };

    load();
    const off = onInventoryChanged(load);
    return off;
  }, []);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-5 md:px-6 md:py-6">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl gradient-pink p-6 text-pink-foreground shadow-pink md:p-8"
        >
          <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-white/20 blur-3xl" />
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-pink-foreground/80">
            Today's offers
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">
            Save big while you scan
          </h1>
          <p className="mt-2 max-w-lg text-sm text-pink-foreground/90">
            Discounts apply automatically when matching items hit your cart.
          </p>
        </motion.section>

        <section className="grid gap-4 md:grid-cols-3">
          {banners.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group flex items-start gap-4 rounded-2xl bg-card p-5 shadow-card transition-all hover:shadow-elev"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface-pink text-sm font-bold">
                {b.emoji}
              </div>
              <div className="flex-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-pink-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-pink">
                  <Clock className="h-3 w-3" /> {b.tag}
                </span>
                <h3 className="mt-1.5 font-display text-base font-bold text-dark-green">{b.title}</h3>
                <p className="text-xs text-muted-foreground">{b.sub}</p>
              </div>
            </motion.div>
          ))}
        </section>

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-3xl bg-card p-5 shadow-card"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-pink" />
              <h2 className="font-display text-lg font-bold text-dark-green">Hot deals</h2>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">From local catalog</span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {products.map((p, i) => {
              const productName = normalizeProductName(p.name);
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="group relative flex flex-col rounded-2xl bg-surface-soft p-3 transition-all hover:shadow-soft"
                >
                  <span className="absolute right-3 top-3 rounded-full gradient-pink px-2 py-0.5 text-[10px] font-bold text-pink-foreground shadow-soft">
                    -{10 + (i % 4) * 5}%
                  </span>
                  <div className="mb-2 flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-card">
                    <ProductImage
                      imageUrl={p.image_url}
                      name={productName}
                      category={p.category}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      fallback={<Tag className="h-8 w-8 text-muted-foreground/50" />}
                    />
                  </div>
                  <p className="line-clamp-2 text-sm font-semibold text-dark-green">{productName}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.category}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-display text-base font-bold text-dark-green">₹{Number(p.price).toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        await addProductToCart(p.id);
                        toast.success(`Added ${productName}`);
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary text-primary-foreground shadow-glow transition active:scale-90 hover:scale-105"
                      aria-label={`Add ${productName}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        <section className="rounded-3xl bg-surface-green p-5">
          <p className="text-sm text-dark-green">
            <span className="font-bold">Tip:</span> Stock updates now come from the local product catalog, so scan, cart, and admin stay in sync.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
