import { Link } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ShoppingBag, ArrowRight, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CartItemCard } from "@/components/CartItemCard";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";

interface Props { children: React.ReactNode }

export function CartDrawer({ children }: Props) {
  const { items, totals, budget } = useCart();
  const overBudget = totals.total > budget;
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="left" className="flex w-full max-w-md flex-col border-r-0 bg-background p-0">
        <SheetHeader className="gradient-dark px-5 py-4 text-left">
          <SheetTitle className="flex items-center gap-2 text-dark-green-foreground">
            <ShoppingBag className="h-5 w-5" />
            Your cart
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
              {count}
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {items.length === 0 ? (
            <div className="rounded-2xl bg-muted p-8 text-center">
              <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground/60" />
              <p className="mt-3 text-sm font-semibold">No items yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Scan a product to add it here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {items.map((i) => <CartItemCard key={i.id} item={i} />)}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="border-t border-border bg-card p-4">
          <div className="mb-3 space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums text-foreground">₹{totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax (8%)</span>
              <span className="tabular-nums text-foreground">₹{totals.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-1 font-display text-lg font-extrabold text-dark-green">
              <span>Total</span>
              <span className={cn("tabular-nums", overBudget && "text-destructive")}>
                ₹{totals.total.toFixed(2)}
              </span>
            </div>
          </div>
          {overBudget && (
            <div className="mb-3 rounded-xl bg-pink-soft px-3 py-2 text-xs font-semibold text-pink">
              ⚠ You're over budget. Adjust items or raise your budget to continue.
            </div>
          )}
          <SheetClose asChild>
            <Button
              asChild
              variant="hero"
              size="lg"
              className="w-full"
              disabled={items.length === 0 || overBudget}
            >
              <Link to="/checkout">
                Checkout <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
