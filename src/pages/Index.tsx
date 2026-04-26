import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, Sparkles, Tag, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { BudgetBar } from "@/components/BudgetBar";
import { CartItemCard } from "@/components/CartItemCard";
import { Recommendations } from "@/components/Recommendations";
import { ScanSimulator } from "@/components/ScanSimulator";
import { BudgetDialog } from "@/components/BudgetDialog";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";

const Index = () => {
  const { cartId, items, totals, loading, budget, setBudget } = useCart();
  const overBudget = totals.total > budget;
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <AppShell>
      <div className="w-full px-4 py-5 md:px-6 md:py-6">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-2xl border border-border bg-card p-2.5 shadow-card md:p-3"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
                Smart Shop · Aisle 4
              </p>
              <h1 className="mt-1 font-display text-xl font-bold leading-tight text-dark-green md:text-2xl">
                Welcome!
              </h1>
              <p className="mt-1 max-w-lg text-xs text-muted-foreground md:text-sm">
                Drop items in the cart. The RFID reader scans them automatically.
              </p>
            </div>
            <Link
              to="/offers"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-pink px-4 text-sm font-semibold text-pink-foreground shadow-pink transition-transform hover:scale-105"
            >
              <Tag className="h-4 w-4" />
              See today's offers
            </Link>
          </div>
        </motion.section>

        <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,11fr)_minmax(380px,9fr)]">
          <div className="space-y-5">
            <section className="rounded-2xl bg-card p-3 shadow-card md:p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-semibold text-dark-green md:text-2xl">Scan & Add Items</h2>
                  <p className="mt-1 text-sm text-muted-foreground md:text-base">
                    Tap the RFID control to add products quickly.
                  </p>
                </div>
                <span className="flex h-8 items-center gap-1.5 rounded-full bg-surface-green px-3 text-xs font-medium text-dark-green">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                  Live scanner
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-start gap-3">
                <div className="min-w-[136px]">
                  <ScanSimulator />
                </div>
                <BudgetDialog cartId={cartId} budget={budget} onChange={setBudget}>
                  <div className="min-w-[360px] flex-[1.6] cursor-pointer">
                    <BudgetBar spent={totals.total} budget={budget} />
                  </div>
                </BudgetDialog>
              </div>
            </section>

            <Recommendations items={items} />
          </div>

          <aside className="h-full overflow-hidden rounded-2xl bg-card p-4 shadow-elev md:p-5 lg:w-full lg:min-w-[380px]">
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex h-full min-h-0 flex-col"
            >
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="font-display text-xl font-semibold text-dark-green">Cart Summary</h2>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto pr-1 lg:max-h-[170px]">
                {loading ? (
                  <div className="rounded-2xl bg-muted p-6 text-center text-sm text-muted-foreground">Loading...</div>
                ) : items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-surface-soft p-6 text-center">
                    <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-3 text-base font-semibold text-dark-green">Your cart is empty</p>
                    <p className="mt-1 text-sm text-muted-foreground">Use Tap to Scan to add your first item.</p>
                  </div>
                ) : (
                  <div className="space-y-2 pb-3">
                    <AnimatePresence initial={false}>
                      {items.map((item) => (
                        <CartItemCard key={item.id} item={item} />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              <div className="mt-3 rounded-2xl bg-surface-soft p-3">
                <div className="space-y-2 text-xs md:text-sm">
                  <Row label="Items" value={itemCount.toString()} />
                  <Row label="Subtotal" value={`$${totals.subtotal.toFixed(2)}`} />
                  <Row label="Tax (8%)" value={`$${totals.tax.toFixed(2)}`} />
                  <hr className="my-1.5 border-border" />
                  <div className="flex items-baseline justify-between">
                    <span className="font-display text-base font-semibold text-dark-green">Total</span>
                    <span className={`font-display text-lg font-extrabold tabular-nums ${overBudget ? "text-pink" : "text-dark-green"}`}>
                      ${totals.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {overBudget && (
                  <div className="mt-2 rounded-xl bg-pink-soft px-3 py-2 text-xs font-semibold text-pink">
                    Over budget - checkout is blocked. Remove items or raise budget.
                  </div>
                )}

                <Button
                  asChild
                  variant="hero"
                  size="default"
                  className="mt-3 h-10 w-full text-sm"
                  disabled={items.length === 0 || overBudget}
                >
                  <Link to="/checkout">
                    Proceed to checkout <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span className="text-xs md:text-sm">{label}</span>
      <span className="text-xs font-semibold tabular-nums text-foreground md:text-sm">{value}</span>
    </div>
  );
}

export default Index;
