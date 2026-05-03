import { motion } from "framer-motion";
import { AlertTriangle, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  spent: number;
  budget: number;
  onEditBudget?: () => void;
}

export function BudgetBar({ spent, budget, onEditBudget }: Props) {
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const overBudget = spent > budget;
  const nearLimit = pct >= 80 && !overBudget;

  const fillColor = overBudget
    ? "bg-red-500"
    : nearLimit
      ? "bg-warning"
      : "gradient-primary";

  return (
    <div className="rounded-2xl bg-card p-4 shadow-card">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={onEditBudget}
          className="flex items-center gap-1.5 text-sm font-semibold text-dark-green hover:text-primary"
        >
          <Wallet className="h-4 w-4" />
          Budget
        </button>
        <div className="flex items-baseline gap-1 tabular-nums">
          <span className={cn("text-base font-bold text-dark-green", overBudget && "text-red-500")}>
            ${spent.toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground">/ ${budget.toFixed(2)}</span>
        </div>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full bg-muted">
        <motion.div
          className={cn("h-full rounded-full shadow-soft", fillColor)}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          style={{ minWidth: pct > 0 ? "0.75rem" : 0 }}
        />
      </div>
      {(nearLimit || overBudget) && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold",
            overBudget ? "bg-red-100 text-red-700" : "bg-warning/15 text-warning"
          )}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          {overBudget ? "You exceeded your budget" : "You are nearing your budget"}
        </motion.div>
      )}
    </div>
  );
}
