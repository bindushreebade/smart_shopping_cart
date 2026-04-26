import { useState } from "react";
import { Loader2, Radio } from "lucide-react";
import { addProductToCart, getInventoryProducts } from "@/lib/cart-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { isBlockedProductName, normalizeProductName } from "@/lib/demo-products";

export function ScanSimulator() {
  const [scanning, setScanning] = useState(false);

  const handleScan = async () => {
    if (scanning) return;
    setScanning(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 700));

      const eligibleProducts = getInventoryProducts().filter(
        (product) => !isBlockedProductName(product.name) && product.stock > 0,
      );

      if (eligibleProducts.length === 0) {
        toast.error("No products in stock");
        return;
      }

      const product =
        eligibleProducts[Math.floor(Math.random() * eligibleProducts.length)];

      await addProductToCart(product.id);

      toast.success(`Scanned: ${normalizeProductName(product.name)}`, {
        description: product.rfid_tag ? `RFID ${product.rfid_tag}` : "Added to cart",
      });
    } catch (error: any) {
      toast.error(error.message ?? "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleScan}
        disabled={scanning}
        className={cn(
          "group relative flex h-[54px] w-[140px] items-center gap-2 overflow-hidden rounded-2xl border border-primary/20 bg-card px-2.5 text-left text-dark-green shadow-soft transition-all duration-300",
          "hover:border-primary/50 hover:bg-surface-green active:scale-[0.98]",
          !scanning && "ring-1 ring-primary/20",
          scanning && "cursor-wait",
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/15">
          {scanning ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <Radio className="h-5.5 w-5.5 text-primary" />
          )}
        </div>
        <div>
          <p className="font-display text-xs font-semibold leading-tight text-dark-green">
            {scanning ? "Scanning..." : "Tap to Scan"}
          </p>
          <p className="text-[10px] text-muted-foreground">RFID Reader</p>
        </div>
      </button>
      <p className="text-xs text-muted-foreground">
        Keep item tag near the reader for instant add.
      </p>
    </div>
  );
}
