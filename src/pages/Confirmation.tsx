import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Receipt, Home } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { getOrderById, type OrderRow } from "@/lib/cart-store";

export default function Confirmation() {
  const { id } = useParams();
  const [tx, setTx] = useState<OrderRow | null>(null);

  useEffect(() => {
    if (!id) return;
    setTx(getOrderById(id));
  }, [id]);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-md px-4 pb-12 pt-8">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full gradient-primary shadow-glow"
        >
          <CheckCircle2 className="h-14 w-14 text-primary-foreground" strokeWidth={2.5} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h1 className="font-display text-3xl font-extrabold text-dark-green">Payment successful!</h1>
          <p className="mt-1 text-sm text-muted-foreground">Thanks for shopping with Smart Shop.</p>
        </motion.div>

        {tx && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-8 rounded-3xl bg-card p-6 shadow-card"
          >
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Receipt className="h-3.5 w-3.5" /> Receipt
            </div>
            <div className="space-y-2 text-sm">
              <Row label="Reference" value={tx.reference} mono />
              <Row label="Method" value={tx.payment_method.toUpperCase()} />
              <Row label="Date" value={new Date(tx.created_at).toLocaleString()} />
              <hr className="my-3 border-border" />
              <Row label="Subtotal" value={`₹${Number(tx.subtotal).toFixed(2)}`} />
              <Row label="Tax" value={`₹${Number(tx.tax).toFixed(2)}`} />
              <div className="flex justify-between pt-2 font-display text-xl font-extrabold text-dark-green">
                <span>Total paid</span>
                <span className="tabular-nums text-primary">₹{Number(tx.total).toFixed(2)}</span>
              </div>
            </div>
          </motion.section>
        )}

        <Button asChild variant="hero" size="lg" className="mt-6 w-full">
          <Link to="/"><Home className="h-5 w-5" /> Start a new trip</Link>
        </Button>
      </div>
    </AppShell>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-xs" : "font-semibold"}>{value}</span>
    </div>
  );
}
