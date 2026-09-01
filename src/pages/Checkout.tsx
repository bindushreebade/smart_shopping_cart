import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { checkoutCart } from "@/lib/cart-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { normalizeProductName } from "@/lib/demo-products";
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Checkout() {
  const { cartId, items, totals, budget } = useCart();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const overBudget = totals.total > budget;

const pay = async () => {
  if (!cartId || items.length === 0 || overBudget) return;

  setProcessing(true);

  try {
    // Step 1: Create Razorpay order through our backend
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE}/api/payment/create-order`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: totals.total,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Could not create payment order");
    }

    const data = await response.json();

    // Step 2: Configure Razorpay Checkout
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,

      amount: data.order.amount,
      currency: data.order.currency,

      name: "Smart Shopping Cart",
      description: "Shopping Cart Payment",

      order_id: data.order.id,

    handler: async function (response: any) {
  try {
    const verifyResponse = await fetch(
      `${import.meta.env.VITE_API_BASE}/api/payment/verify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        }),
      }
    );

    const result = await verifyResponse.json();

    if (!verifyResponse.ok || !result.success) {
      throw new Error(result.message || "Payment verification failed");
    }

    console.log("Payment verified:", response);

    toast.success("Payment verified successfully");
    const tx = await checkoutCart("razorpay");

navigate(`/confirmation/${tx.id}`);

  } catch (error: any) {
    console.error("Payment verification error:", error);
    toast.error(error.message || "Payment verification failed");
  } finally {
    setProcessing(false);
  }
},

      prefill: {
        name: "",
        email: "",
        contact: "",
      },

      theme: {
        color: "#3399cc",
      },

      modal: {
        ondismiss: function () {
          setProcessing(false);
        },
      },
    };

    // Step 3: Open Razorpay Checkout
    const razorpay = new window.Razorpay(options);

    razorpay.open();

  } catch (e: any) {
    console.error(e);
    toast.error(e.message ?? "Payment failed");
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

        <div className="mx-auto grid w-full max-w-[760px] gap-5">
          <section className="rounded-3xl bg-card p-5 shadow-card">
            <h2 className="mb-3 font-display text-base font-bold text-dark-green">Order summary</h2>
            <div className="space-y-1.5 text-sm">
              {items.map((i) => (
                <div key={i.id} className="flex justify-between text-muted-foreground">
                  <span className="truncate pr-2">
                    {normalizeProductName(i.product?.name)} <span className="text-xs">x{i.quantity}</span>
                  </span>
                  <span className="tabular-nums text-foreground">
                    ₹{(i.quantity * Number(i.unit_price)).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <hr className="my-3 border-border" />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span><span className="tabular-nums">₹{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax (8%)</span><span className="tabular-nums">₹{totals.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1 font-display text-xl font-extrabold text-dark-green">
                <span>Total</span>
                <span className={cn("tabular-nums", overBudget && "text-pink")}>
                  ₹{totals.total.toFixed(2)}
                </span>
              </div>
            </div>
            {overBudget && (
              <div className="mt-3 rounded-xl bg-pink-soft px-3 py-2 text-xs font-semibold text-pink">
                You are over your ₹{budget.toFixed(2)} budget. Adjust the cart to continue.
              </div>
            )}

            <Button
              variant="hero"
              size="lg"
              className="mt-5 mx-auto block w-full max-w-[420px]"
              onClick={pay}
              disabled={processing || items.length === 0 || overBudget}
            >
              {processing ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
              ) : (
                `Proceed to pay ₹${totals.total.toFixed(2)}`
              )}
            </Button>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
