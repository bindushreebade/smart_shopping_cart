import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Receipt, Calendar, CreditCard, Smartphone, Wallet } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { cn } from "@/lib/utils";
import { getStoredOrders, onOrdersChanged, type OrderRow } from "@/lib/cart-store";

const methodIcon = (m: string) => {
  if (m === "upi") return Smartphone;
  if (m === "card") return CreditCard;
  return Wallet;
};

export default function Orders() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => {
      setOrders(getStoredOrders());
      setLoading(false);
    };

    load();
    const off = onOrdersChanged(load);
    return off;
  }, []);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1400px] space-y-5 px-4 py-5 md:px-6 md:py-6">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl gradient-dark p-6 text-dark-green-foreground shadow-elev md:p-8"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary-glow">History</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">Your orders</h1>
          <p className="mt-2 text-sm text-dark-green-foreground/70">Receipts from previous shopping trips.</p>
        </motion.section>

        <section className="rounded-3xl bg-card p-5 shadow-card">
          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center">
              <Receipt className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 font-semibold text-dark-green">No orders yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Complete a checkout to see receipts here.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {orders.map((o, i) => {
                const Icon = methodIcon(o.payment_method);
                return (
                  <motion.div
                    key={o.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-4 rounded-2xl bg-surface-soft p-4 transition-all hover:shadow-soft"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-soft">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-mono text-xs font-semibold text-dark-green">{o.reference}</p>
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                          o.status === "completed" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                        )}>
                          {o.status}
                        </span>
                      </div>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(o.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg font-extrabold tabular-nums text-dark-green">
                        ${Number(o.total).toFixed(2)}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {o.payment_method}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
