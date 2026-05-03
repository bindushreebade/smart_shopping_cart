import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Package, ShoppingCart, DollarSign, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { AppShell } from "@/components/AppShell";
import { cn } from "@/lib/utils";
import { isBlockedProductName, normalizeProductName } from "@/lib/demo-products";
import {
  fetchCartItems,
  getInventoryProducts,
  getStoredOrders,
  onCartChanged,
  onInventoryChanged,
  onOrdersChanged,
} from "@/lib/cart-store";

interface Stats {
  todayRevenue: number;
  totalOrders: number;
  activeCarts: number;
  lowStock: number;
}

interface ProductRow { id: string; name: string; stock: number; price: number; category: string | null }
interface PopularRow { name: string; sold: number }
interface DailyRow { day: string; revenue: number }

export default function Admin() {
  const [stats, setStats] = useState<Stats>({ todayRevenue: 0, totalOrders: 0, activeCarts: 0, lowStock: 0 });
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [popular, setPopular] = useState<PopularRow[]>([]);
  const [daily, setDaily] = useState<DailyRow[]>([]);

  useEffect(() => {
    load();
    const offCart = onCartChanged(load);
    const offInventory = onInventoryChanged(load);
    const offOrders = onOrdersChanged(load);
    return () => {
      offCart();
      offInventory();
      offOrders();
    };
  }, []);

  async function load() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const txList = getStoredOrders();
    const prods = getInventoryProducts().sort((a, b) => a.stock - b.stock);
    const items = await fetchCartItems("local-cart");

    const todayRevenue = txList
      .filter((t) => new Date(t.created_at) >= today)
      .reduce((s, t) => s + Number(t.total), 0);

    setStats({
      todayRevenue,
      totalOrders: txList.length,
      activeCarts: items.length > 0 ? 1 : 0,
      lowStock: prods.filter((p) => p.stock < 10).length,
    });
    setProducts(prods.filter((product) => !isBlockedProductName(product.name)));

    const tally: Record<string, number> = {};
    for (const it of items) {
      const name = it.product?.name;
      if (name && !isBlockedProductName(name)) {
        const normalized = normalizeProductName(name);
        tally[normalized] = (tally[normalized] ?? 0) + it.quantity;
      }
    }
    setPopular(
      Object.entries(tally)
        .map(([name, sold]) => ({ name, sold }))
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5),
    );

    const days: DailyRow[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      const rev = txList
        .filter((t) => new Date(t.created_at) >= d && new Date(t.created_at) < next)
        .reduce((s, t) => s + Number(t.total), 0);
      days.push({ day: d.toLocaleDateString(undefined, { weekday: "short" }), revenue: +rev.toFixed(2) });
    }
    setDaily(days);
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6">
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl gradient-dark p-6 text-dark-green-foreground shadow-elev md:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary-glow">Overview</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">Admin dashboard</h1>
          <p className="mt-2 text-sm text-dark-green-foreground/70">Live insights from your local product catalog.</p>
        </motion.section>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard icon={DollarSign} label="Today's revenue" value={`$${stats.todayRevenue.toFixed(2)}`} accent />
          <StatCard icon={TrendingUp} label="Total orders" value={stats.totalOrders.toString()} />
          <StatCard icon={ShoppingCart} label="Active carts" value={stats.activeCarts.toString()} />
          <StatCard icon={AlertCircle} label="Low stock" value={stats.lowStock.toString()} warn={stats.lowStock > 0} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl bg-white p-5 shadow-card">
            <h2 className="mb-4 font-display text-base font-bold">Revenue - last 7 days</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                    formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-card">
            <h2 className="mb-4 font-display text-base font-bold">Popular in active carts</h2>
            {popular.length === 0 ? (
              <p className="text-sm text-muted-foreground">No items in the local cart yet.</p>
            ) : (
              <ul className="space-y-2">
                {popular.map((p, i) => (
                  <li key={p.name} className="flex items-center gap-3 rounded-xl bg-surface-green p-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full gradient-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                    <span className="flex-1 truncate text-sm font-medium">{normalizeProductName(p.name)}</span>
                    <span className="text-xs font-semibold tabular-nums text-muted-foreground">{p.sold} units</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="rounded-2xl bg-white p-5 shadow-card">
          <div className="mb-4 flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <h2 className="font-display text-base font-bold">Inventory</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2">Product</th>
                  <th className="py-2">Category</th>
                  <th className="py-2 text-right">Price</th>
                  <th className="py-2 text-right">Stock</th>
                  <th className="py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const low = p.stock < 10;
                  const out = p.stock === 0;
                  return (
                    <tr key={p.id} className="border-b border-border/50 last:border-0">
                      <td className="py-3 font-medium">{normalizeProductName(p.name)}</td>
                      <td className="py-3 text-muted-foreground">{p.category}</td>
                      <td className="py-3 text-right tabular-nums">${Number(p.price).toFixed(2)}</td>
                      <td className="py-3 text-right tabular-nums">{p.stock}</td>
                      <td className="py-3 text-right">
                        <span className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          out ? "bg-destructive/10 text-destructive" :
                          low ? "bg-warning/15 text-warning" : "bg-success/10 text-success",
                        )}>
                          {out ? "Out" : low ? "Low" : "OK"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function StatCard({ icon: Icon, label, value, accent, warn }: { icon: any; label: string; value: string; accent?: boolean; warn?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl p-4 shadow-card",
        accent ? "gradient-primary text-primary-foreground" :
        warn ? "bg-destructive/10" : "bg-card",
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", accent ? "" : warn ? "text-destructive" : "text-primary")} />
        <span className={cn("text-xs font-semibold uppercase tracking-wider", accent ? "" : "text-muted-foreground")}>{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-extrabold tabular-nums">{value}</p>
    </motion.div>
  );
}
