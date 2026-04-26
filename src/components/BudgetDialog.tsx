import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setStoredBudget } from "@/lib/cart-store";

interface Props {
  cartId: string | null;
  budget: number;
  onChange: (v: number) => void;
  children: React.ReactNode;
}

export function BudgetDialog({ cartId: _cartId, budget, onChange, children }: Props) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState(String(budget));

  const save = async () => {
    const n = parseFloat(val);
    if (!isFinite(n) || n <= 0) return;
    setStoredBudget(n);
    onChange(n);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Set your budget</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-muted-foreground">$</span>
          <Input
            type="number"
            min={1}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="rounded-xl text-lg"
            autoFocus
          />
        </div>
        <Button variant="hero" onClick={save}>Save budget</Button>
      </DialogContent>
    </Dialog>
  );
}
