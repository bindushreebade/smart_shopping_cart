import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Smartphone, CreditCard, Wallet, Check, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { checkoutCart } from "@/lib/cart-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { normalizeProductName } from "@/lib/demo-products";

type Method = "upi" | "card" | "wallet";

const methods: { id: Method; label: string; sub: string; icon: typeof Smartphone }[] = [
  { id: "upi", label: "UPI", sub: "Pay via any UPI app", icon: Smartphone },
  { id: "card", label: "Card", sub: "Credit / debit card", icon: CreditCard },
  { id: "wallet", label: "Wallet", sub: "Apple Pay, Google Pay", icon: Wallet },
];

export default function Checkout() {
  const { cartId, items, totals, budget } = useCart();
  const navigate = useNavigate();
  const [method, setMethod] = useState<Method>("upi");
  const [processing, setProcessing] = useState(false);
  const overBudget = totals.total > budget;

  const pay = async () => {
    if (!cartId || items.length === 0 || overBudget) return;
    setProcessing(true);
    try {
      const tx = await checkoutCart(method);
      navigate(`/confirmation/${tx.id}`);
    } catch (e: any) {
      toast.error(e.message ?? "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1100px] space-y-5 px-4 py-5 md:px-6 md:py-6">
        <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-dark-green">
          <ArrowLeft className="h-4 w-4" /> Back to cart
        </Link>

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl gradient-dark p-6 text-dark-green-foreground shadow-elev md:p-8"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary-glow">Checkout</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">Almost done!</h1>
          <p className="mt-2 text-sm text-dark-green-foreground/70">Pick a payment method and confirm.</p>
        </motion.section>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-3xl bg-card p-5 shadow-card">
            <h2 className="mb-3 font-display text-base font-bold text-dark-green">Order summary</h2>
            <div className="space-y-1.5 text-sm">
              {items.map((i) => (
                <div key={i.id} className="flex justify-between text-muted-foreground">
                  <span className="truncate pr-2">
                    {normalizeProductName(i.product?.name)} <span className="text-xs">x{i.quantity}</span>
                  </span>
                  <span className="tabular-nums text-foreground">
                    ${(i.quantity * Number(i.unit_price)).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <hr className="my-3 border-border" />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span><span className="tabular-nums">${totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax (8%)</span><span className="tabular-nums">${totals.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1 font-display text-xl font-extrabold text-dark-green">
                <span>Total</span>
                <span className={cn("tabular-nums", overBudget && "text-pink")}>
                  ${totals.total.toFixed(2)}
                </span>
              </div>
            </div>
            {overBudget && (
              <div className="mt-3 rounded-xl bg-pink-soft px-3 py-2 text-xs font-semibold text-pink">
                You are over your ${budget.toFixed(2)} budget. Adjust the cart to continue.
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-2 px-1 font-display text-base font-bold text-dark-green">Payment method</h2>
            <div className="space-y-2">
              {methods.map((m) => {
                const Icon = m.icon;
                const active = method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all",
                      active
                        ? "border-primary bg-surface-green shadow-glow"
                        : "border-transparent bg-card shadow-card hover:border-primary/30",
                    )}
                  >
                    <div className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-xl",
                      active ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-dark-green">{m.label}</p>
                      <p className="text-xs text-muted-foreground">{m.sub}</p>
                    </div>
                    <div className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full border-2",
                      active ? "border-primary bg-primary" : "border-border",
                    )}>
                      {active && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <Button
              variant="hero"
              size="lg"
              className="mt-4 w-full"
              onClick={pay}
              disabled={processing || items.length === 0 || overBudget}
            >
              {processing ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
              ) : (
                `Pay $${totals.total.toFixed(2)}`
              )}
            </Button>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
