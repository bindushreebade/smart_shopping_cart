import { useEffect, useState, useCallback } from "react";
import {
  ensureCartSession,
  fetchCartItems,
  CartItemRow,
  calcTotals,
  getStoredBudget,
  onCartChanged,
  onInventoryChanged,
} from "@/lib/cart-store";
import { isBlockedProductName } from "@/lib/demo-products";

export function useCart() {
  const [cartId, setCartId] = useState<string | null>(null);
  const [items, setItems] = useState<CartItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState<number>(getStoredBudget());

  const refresh = useCallback(async (id?: string) => {
    const target = id ?? cartId;
    if (!target) return;
    const data = await fetchCartItems(target);
    setItems(data.filter((item) => !isBlockedProductName(item.product?.name)));
  }, [cartId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const id = await ensureCartSession();
        if (!mounted) return;
        setCartId(id);
        await refresh(id);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!cartId) return;
    const off = onCartChanged(() => refresh(cartId));
    const offInventory = onInventoryChanged(() => refresh(cartId));
    return () => {
      off();
      offInventory();
    };
  }, [cartId, refresh]);

  const totals = calcTotals(items);

  return { cartId, items, totals, loading, budget, setBudget, refresh };
}
