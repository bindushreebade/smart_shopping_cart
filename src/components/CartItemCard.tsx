import { forwardRef } from "react";
import { Minus, Plus, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CartItemRow, updateQuantity, removeItem } from "@/lib/cart-store";
import { ProductImage } from "@/components/ProductImage";
import { normalizeProductName } from "@/lib/demo-products";

interface Props { item: CartItemRow }

export const CartItemCard = forwardRef<HTMLDivElement, Props>(function CartItemCard({ item }, ref) {
  const product = item.product!;
  const productName = normalizeProductName(product.name);
  const lineTotal = (item.quantity * Number(item.unit_price)).toFixed(2);

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="flex items-center gap-2.5 rounded-2xl bg-card p-2.5 shadow-card"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-green">
        <ProductImage
          imageUrl={product.image_url}
          name={productName}
          category={product.category}
          className="h-full w-full object-cover"
          fallback={
          <Package className="h-6 w-6 text-dark-green/60" />
          }
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-xs">{productName}</p>
        <p className="text-[11px] text-muted-foreground">${Number(item.unit_price).toFixed(2)} each</p>
        <div className="mt-1 flex gap-2 flex-wrap text-[10px] text-muted-foreground">
          {product.aisle && <span>Aisle {product.aisle}</span>}
          {product.shelf && <span className="capitalize">Shelf: {product.shelf}</span>}
          {product.category && <span className="capitalize">{product.category}</span>}
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition active:scale-90 hover:bg-secondary/70"
            aria-label="Decrease quantity"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-5 text-center text-xs font-semibold tabular-nums">{item.quantity}</span>
          <button
            type="button"
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground transition active:scale-90 hover:bg-primary/90"
            aria-label="Increase quantity"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="font-display text-sm font-bold tabular-nums">${lineTotal}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => removeItem(item.id)}
          className="h-6 px-1.5 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </motion.div>
  );
});
