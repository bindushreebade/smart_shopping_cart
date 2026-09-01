import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Package,
  ShoppingCart,
  IndianRupee,
  AlertCircle,
  Upload,
  Plus,
  FileSpreadsheet,
  X,
  AlertTriangle,
  LucideGitGraph,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import * as XLSX from "xlsx";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import {
  isBlockedProductName,
  normalizeProductName,
} from "@/lib/demo-products";

import {
  apiRequest,
  clearAdminToken,
  getAdminToken,
} from "@/lib/api";

import {
  dedupeProductRows,
  normalizeProductRow,
  parseCsvText,
  type ProductImportRow,
} from "@/lib/product-import";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface Stats {
  todayRevenue: number;
  totalOrders: number;
  activeCarts: number;
  lowStock: number;
}

interface ProductRow {
  id: string;
  name: string;
  stock: number;
  price: number;
  category: string | null;
  reorderLevel: number;
}

interface PopularRow {
  name: string;
  sold: number;
}

interface DailyRow {
  day: string;
  revenue: number;
}

interface TransactionRow {
  id: string;
  total: number;
  createdAt: string;
  paymentStatus: string;
  itemCount: number;
  itemSummary: string;
}

type StatusType = "success" | "error" | "info";

/* -------------------------------------------------------------------------- */
/*                              INITIAL FORM                                  */
/* -------------------------------------------------------------------------- */

const emptyManualForm = {
  name: "",
  category: "General",
  price: "",
  stock: "",
  aisle: "",
  shelf: "",
  reorderLevel: "10",
};

/* -------------------------------------------------------------------------- */
/*                           FILE PARSING HELPERS                             */
/* -------------------------------------------------------------------------- */

function normalizeRows(rows: Record<string, any>[]): ProductImportRow[] {
  const normalized = rows
    .map((row) => normalizeProductRow(row))
    .filter((row): row is ProductImportRow => Boolean(row));

  return dedupeProductRows(normalized);
}

async function readProductFile(file: File): Promise<ProductImportRow[]> {
  const fileName = file.name.toLowerCase();

  /* ------------------------------- CSV ---------------------------------- */

  if (fileName.endsWith(".csv")) {
    const text = await file.text();
    const csvRows = parseCsvText(text);

    return normalizeRows(csvRows);
  }

  /* ------------------------------ EXCEL --------------------------------- */

  if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
    const buffer = await file.arrayBuffer();

    const workbook = XLSX.read(buffer, {
      type: "array",
    });

    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new Error("The Excel file does not contain any sheets.");
    }

    const sheet = workbook.Sheets[firstSheetName];

    const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
      defval: "",
    });

    return normalizeRows(jsonRows);
  }

  throw new Error(
    "Unsupported file format. Please upload a CSV, XLSX, or XLS file.",
  );
}

/* -------------------------------------------------------------------------- */
/*                                COMPONENT                                   */
/* -------------------------------------------------------------------------- */

export default function Admin() {
  const navigate = useNavigate();

  /* ---------------------------------------------------------------------- */
  /*                                  STATE                                 */
  /* ---------------------------------------------------------------------- */

  const [stats, setStats] = useState<Stats>({
    todayRevenue: 0,
    totalOrders: 0,
    activeCarts: 0,
    lowStock: 0,
  });

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [popular, setPopular] = useState<PopularRow[]>([]);
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);

  const [manualForm, setManualForm] = useState(emptyManualForm);

  const [vendorId, setVendorId] = useState<number | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isLowStockOpen, setIsLowStockOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<StatusType>("info");

  /*
   * This ref is important.
   *
   * React state updates are asynchronous. A user could theoretically
   * double-click before `isSaving` finishes updating.
   *
   * This ref acts as an immediate lock and prevents duplicate requests.
   */
  const saveLockRef = useRef(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* ---------------------------------------------------------------------- */
  /*                              DERIVED VALUES                            */
  /* ---------------------------------------------------------------------- */

  const productSummary = useMemo(
    () => ({
      count: products.length,

      totalUnits: products.reduce(
        (sum, product) => sum + product.stock,
        0,
      ),
    }),
    [products],
  );

  /* ---------------------------------------------------------------------- */
  /*                                  AUTH                                  */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const token = getAdminToken();

    if (!token) {
      navigate("/admin/login");
      return;
    }

    apiRequest<{
      id: string;
      email: string;
      vendorId: string;
      role: string;
    }>("/admin/me")
      .then((me) => {
        const parsedVendorId = Number(me.vendorId);

        if (!Number.isFinite(parsedVendorId)) {
          throw new Error("Invalid vendor ID.");
        }

        setVendorId(parsedVendorId);
      })
      .catch((error) => {
        console.error("Admin authentication failed:", error);

        clearAdminToken();

        navigate("/admin/login");
      });
  }, [navigate]);

  /*
   * Load dashboard only AFTER vendorId has actually been placed in state.
   *
   * Your previous code called load() immediately after setVendorId().
   * React state updates are asynchronous, so load() could still see
   * vendorId === null.
   */
  useEffect(() => {
    if (!vendorId) {
      return;
    }

    void loadDashboard(vendorId);

    const refreshTimer = window.setInterval(() => {
      void loadDashboard(vendorId);
    }, 5000);

    return () => window.clearInterval(refreshTimer);
  }, [vendorId]);

  /* ---------------------------------------------------------------------- */
  /*                                LOGOUT                                  */
  /* ---------------------------------------------------------------------- */

  function handleLogout() {
    setIsLogoutConfirmOpen(true);
  }

  async function confirmLogout() {
    setIsLoggingOut(true);
    
    // Simulate logout delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    clearAdminToken();
    navigate("/admin/login");
  }

  /* ---------------------------------------------------------------------- */
  /*                         DASHBOARD DATA LOADING                         */
  /* ---------------------------------------------------------------------- */

  async function loadDashboard(currentVendorId: number) {
    try {
      const [productRows, orderRows, cartRows] = await Promise.all([
        apiRequest<any[]>(
          `/vendor/${currentVendorId}/products`,
        ),

        apiRequest<any[]>(
          `/vendor/${currentVendorId}/orders`,
        ),

        apiRequest<any[]>(
          `/vendor/${currentVendorId}/carts`,
        ),
      ]);

      /* ----------------------------- PRODUCTS ---------------------------- */

      const productsFromApi: ProductRow[] = (productRows ?? []).map(
        (product) => ({
          id: String(
            product.product_id ??
              product.id ??
              crypto.randomUUID(),
          ),

          name: product.name ?? "Unnamed product",

          stock: Number(
            product.stock_quantity ??
              product.stock ??
              0,
          ),

          price: Number(product.price ?? 0),

          category:
            product.category ??
            "General",

          reorderLevel: Number(
            product.reorder_level ??
              product.reorderLevel ??
              10,
          ),
        }),
      );

      /* ------------------------------ ORDERS ----------------------------- */

      const normalizedOrders = (orderRows ?? []).map((order) => ({
        ...order,

        total: Number(
          order.total_amount ??
            order.total ??
            0,
        ),

        payment_status:
          String(order.payment_status ?? "paid").toLowerCase(),

        created_at:
          order.created_at ??
          new Date().toISOString(),

        items: Array.isArray(order.items)
          ? order.items.map((item: any) => ({
              product_id: item.product_id ?? item.productId ?? "",
              product_name: item.product_name ?? item.name ?? "Unknown product",
              quantity: Number(item.quantity ?? 0),
              unit_price: Number(item.unit_price ?? item.unitPrice ?? 0),
            }))
          : [],
      }));

      setTransactions(
        normalizedOrders.map((order) => {
          const itemNames = order.items
            .slice(0, 2)
            .map((item: any) => item.product_name || "Item")
            .join(", ");

          return {
            id: String(order.order_id ?? order.id ?? "txn"),
            total: Number(order.total),
            createdAt: order.created_at,
            paymentStatus: order.payment_status,
            itemCount: order.items.reduce((sum: number, item: any) => sum + Number(item.quantity ?? 0), 0),
            itemSummary: order.items.length > 2 ? `${itemNames}, +${order.items.length - 2} more` : itemNames || "No items",
          };
        }),
      );

      /* ------------------------- TODAY'S REVENUE ------------------------- */

      const today = new Date();

      today.setHours(0, 0, 0, 0);

      const todayRevenue = normalizedOrders
        .filter(
          (order) =>
            new Date(order.created_at) >= today,
        )
        .reduce(
          (sum, order) =>
            sum + Number(order.total),
          0,
        );

      /* --------------------------- ACTIVE CARTS -------------------------- */

      const activeCarts = (cartRows ?? []).filter(
        (cart) =>
          String(cart.status ?? "").toLowerCase() === "active",
      ).length;

      /* ---------------------------- LOW STOCK ---------------------------- */

      const lowStock = productsFromApi.filter(
        (product) =>
          product.stock <= product.reorderLevel,
      ).length;

      setStats({
        todayRevenue,
        totalOrders: normalizedOrders.length,
        activeCarts,
        lowStock,
      });

      setProducts(
        productsFromApi.filter(
          (product) =>
            !isBlockedProductName(product.name),
        ),
      );

      const orderItems = ((orderRows ?? []) as any[]).flatMap((order) => {
        const items = Array.isArray(order.items) ? order.items : [];

        return items.map((item: any) => ({
          productId: String(item.product_id ?? item.productId ?? ""),
          productName: String(item.product_name ?? item.name ?? "Unknown product"),
          quantity: Number(item.quantity ?? 0),
        }));
      });

      const productSales = new Map<string, { name: string; sold: number }>();

      for (const item of orderItems) {
        if (!item.productId) continue;

        const current = productSales.get(item.productId) ?? { name: item.productName, sold: 0 };
        current.sold += item.quantity;
        current.name = item.productName || current.name;
        productSales.set(item.productId, current);
      }

      const rankedPopular = [...productSales.entries()]
        .map(([productId, entry]) => ({
          productId,
          name: entry.name,
          sold: entry.sold,
        }))
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5)
        .map((entry) => ({
          name: entry.name,
          sold: entry.sold,
        }));

      setPopular(rankedPopular);

      /* -------------------------- 7-DAY REVENUE -------------------------- */

      const days: DailyRow[] = [];

      for (let i = 6; i >= 0; i--) {
        const start = new Date();

        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - i);

        const end = new Date(start);

        end.setDate(start.getDate() + 1);

        const revenue = normalizedOrders
          .filter((order) => {
            const date = new Date(order.created_at);

            return date >= start && date < end;
          })
          .reduce(
            (sum, order) =>
              sum + Number(order.total),
            0,
          );

        days.push({
          day: start.toLocaleDateString(undefined, {
            weekday: "short",
          }),

          revenue: Number(revenue.toFixed(2)),
        });
      }

      setDaily(days);
    } catch (error) {
      console.error(
        "Failed to load vendor dashboard:",
        error,
      );

      setStatusType("error");

      setStatusMessage(
        "Could not load dashboard data from the server.",
      );
    }
  }

  /* ---------------------------------------------------------------------- */
  /*                          PRODUCT SAVE FUNCTION                         */
  /* ---------------------------------------------------------------------- */

  async function saveProducts(
    rows: ProductImportRow[],
  ): Promise<boolean> {
    if (!vendorId) {
      setStatusType("error");

      setStatusMessage(
        "Vendor information is not available. Please sign in again.",
      );

      return false;
    }

    if (!rows.length) {
      setStatusType("error");

      setStatusMessage(
        "No valid product rows were found.",
      );

      return false;
    }

    /*
     * Hard lock.
     *
     * Even if the user double-clicks faster than React can update
     * the disabled state, only the first request gets through.
     */
    if (saveLockRef.current) {
      return false;
    }

    saveLockRef.current = true;

    setIsSaving(true);

    setStatusType("info");

    setStatusMessage("Saving products...");

    try {
      /*
       * IMPORTANT:
       *
       * We only write to the backend/database here.
       *
       * The previous file also called appendInventoryProducts(),
       * which created a second local source of truth.
       *
       * That has been removed.
       */

      await apiRequest(
        `/vendor/${vendorId}/products/bulk`,
        {
          method: "POST",

          body: JSON.stringify({
            items: rows,
          }),
        },
      );

      setStatusType("success");

      setStatusMessage(
        `${rows.length} product${
          rows.length === 1 ? "" : "s"
        } imported successfully.`,
      );

      /*
       * Reload everything from MySQL/backend.
       *
       * Database remains the single source of truth.
       */
      await loadDashboard(vendorId);

      return true;
    } catch (error: any) {
      console.error(
        "Product import failed:",
        error,
      );

      setStatusType("error");

      setStatusMessage(
        error?.message ||
          "Product import failed.",
      );

      return false;
    } finally {
      saveLockRef.current = false;

      setIsSaving(false);
    }
  }

  /* ---------------------------------------------------------------------- */
  /*                           MANUAL PRODUCT ADD                            */
  /* ---------------------------------------------------------------------- */

  async function handleManualAdd(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSaving || saveLockRef.current) {
      return;
    }

    const row = normalizeProductRow({
      name: manualForm.name,
      category: manualForm.category,
      price: manualForm.price,
      stock: manualForm.stock,
      aisle: manualForm.aisle,
      shelf: manualForm.shelf,
      reorderLevel: manualForm.reorderLevel,
    });

    if (!row) {
      setStatusType("error");

      setStatusMessage(
        "Please enter valid product information.",
      );

      return;
    }

    const success = await saveProducts([row]);

    if (success) {
      setManualForm(emptyManualForm);
    }
  }

  /* ---------------------------------------------------------------------- */
  /*                          FILE SELECTION ONLY                            */
  /* ---------------------------------------------------------------------- */

  function handleFileSelected(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const fileName = file.name.toLowerCase();

    const validFile =
      fileName.endsWith(".csv") ||
      fileName.endsWith(".xlsx") ||
      fileName.endsWith(".xls");

    if (!validFile) {
      setSelectedFile(null);

      event.target.value = "";

      setStatusType("error");

      setStatusMessage(
        "Please select a CSV, XLSX, or XLS file.",
      );

      return;
    }

    /*
     * VERY IMPORTANT:
     *
     * Selecting the file DOES NOT import anything.
     *
     * It only stores the file in state.
     */
    setSelectedFile(file);

    setStatusType("info");

    setStatusMessage(
      `${file.name} selected. Click "Upload selected file" to import it.`,
    );
  }

  /* ---------------------------------------------------------------------- */
  /*                              FILE UPLOAD                               */
  /* ---------------------------------------------------------------------- */

  async function handleFileUpload() {
    /*
     * Clicking the button with no selected file does absolutely
     * nothing except show the user a message.
     */
    if (!selectedFile) {
      setStatusType("error");

      setStatusMessage(
        "Please choose a CSV or Excel file first.",
      );

      return;
    }

    if (isSaving || saveLockRef.current) {
      return;
    }

    try {
      setStatusType("info");

      setStatusMessage(
        `Reading ${selectedFile.name}...`,
      );

      const rows =
        await readProductFile(selectedFile);

      if (!rows.length) {
        setStatusType("error");

        setStatusMessage(
          "No valid product rows were found in the selected file.",
        );

        return;
      }

      const success =
        await saveProducts(rows);

      /*
       * Only clear the selected file after a successful import.
       *
       * If upload fails, the user can retry without choosing
       * the file again.
       */
      if (success) {
        setSelectedFile(null);

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error: any) {
      console.error(
        "File reading failed:",
        error,
      );

      setStatusType("error");

      setStatusMessage(
        error?.message ||
          "The selected file could not be read.",
      );
    }
  }

  /* ---------------------------------------------------------------------- */
  /*                            REMOVE FILE                                  */
  /* ---------------------------------------------------------------------- */

  function clearSelectedFile() {
    if (isSaving) {
      return;
    }

    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setStatusMessage("");
  }

  /* ---------------------------------------------------------------------- */
  /*                                   UI                                   */
  /* ---------------------------------------------------------------------- */

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6">

        {/* --------------------------------------------------------------- */}
        {/* HEADER                                                          */}
        {/* --------------------------------------------------------------- */}

        <motion.section
          initial={{
            opacity: 0,
            y: 8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="rounded-3xl gradient-dark p-6 text-dark-green-foreground shadow-elev md:p-8"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary-glow">
            Overview
          </p>

          <h1 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">
            Admin dashboard
          </h1>

          <p className="mt-2 text-sm text-dark-green-foreground/70">
            Manage inventory and monitor store performance.
          </p>
        </motion.section>

        <div className="flex justify-start">
          <Dialog open={isInventoryOpen} onOpenChange={setIsInventoryOpen}>
            <DialogTrigger asChild>
              <Button type="button" size="sm" variant="secondary" className="rounded-full px-4">
                <Plus className="mr-2 h-4 w-4" />
                Add product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl rounded-3xl">
              <DialogHeader>
                <DialogTitle>Add product inventory</DialogTitle>
                <DialogDescription>
                  Add a single product or upload a CSV/Excel file to restock the catalog.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
                <form onSubmit={handleManualAdd} className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Product name</label>
                    <Input
                      value={manualForm.name}
                      onChange={(event) => setManualForm((previous) => ({ ...previous, name: event.target.value }))}
                      placeholder="e.g. Basmati Rice 5kg"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Category</label>
                    <Input
                      value={manualForm.category}
                      onChange={(event) => setManualForm((previous) => ({ ...previous, category: event.target.value }))}
                      placeholder="e.g. Grocery"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Selling price (₹)</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={manualForm.price}
                      onChange={(event) => setManualForm((previous) => ({ ...previous, price: event.target.value }))}
                      placeholder="Enter price"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Stock quantity</label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={manualForm.stock}
                      onChange={(event) => setManualForm((previous) => ({ ...previous, stock: event.target.value }))}
                      placeholder="Units available"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Aisle</label>
                    <Input
                      value={manualForm.aisle}
                      onChange={(event) => setManualForm((previous) => ({ ...previous, aisle: event.target.value }))}
                      placeholder="e.g. A1"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Shelf</label>
                    <Input
                      value={manualForm.shelf}
                      onChange={(event) => setManualForm((previous) => ({ ...previous, shelf: event.target.value }))}
                      placeholder="e.g. S2"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">Reorder level</label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={manualForm.reorderLevel}
                      onChange={(event) => setManualForm((previous) => ({ ...previous, reorderLevel: event.target.value }))}
                      placeholder="Low-stock alert level"
                    />
                  </div>

                  <Button type="submit" disabled={isSaving || !vendorId} className="md:self-end">
                    <Plus className="mr-2 h-4 w-4" />
                    {isSaving ? "Saving..." : "Add product"}
                  </Button>
                </form>

                <div className="rounded-xl border border-dashed border-border bg-slate-50 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <FileSpreadsheet className="h-4 w-4 text-primary" />
                    CSV / Excel import
                  </div>

                  <label
                    className={cn(
                      "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white px-4 py-6 text-center text-sm transition",
                      isSaving ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-slate-50",
                    )}
                  >
                    <Upload className="mb-2 h-5 w-5 text-primary" />
                    <span className="font-medium text-foreground">Choose product file</span>
                    <span className="mt-1 text-xs text-muted-foreground">CSV, XLSX or XLS</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={handleFileSelected}
                      disabled={isSaving}
                    />
                  </label>

                  {selectedFile && (
                    <div className="mt-3 flex items-center gap-3 rounded-lg border bg-white p-3">
                      <FileSpreadsheet className="h-5 w-5 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button
                        type="button"
                        onClick={clearSelectedFile}
                        disabled={isSaving}
                        className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-3 w-full"
                    onClick={handleFileUpload}
                    disabled={!selectedFile || isSaving || !vendorId}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {isSaving ? "Uploading..." : "Upload selected file"}
                  </Button>

                  {!selectedFile && (
                    <p className="mt-2 text-center text-xs text-muted-foreground">Select a file to enable upload.</p>
                  )}
                </div>
              </div>

              {statusMessage && (
                <p
                  className={cn(
                    "mt-4 rounded-md border px-3 py-2 text-sm",
                    statusType === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
                    statusType === "error" && "border-red-200 bg-red-50 text-red-700",
                    statusType === "info" && "border-blue-200 bg-blue-50 text-blue-700",
                  )}
                >
                  {statusMessage}
                </p>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* --------------------------------------------------------------- */}
        {/* STAT CARDS                                                      */}
        {/* --------------------------------------------------------------- */}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

          <StatCard
            icon={IndianRupee}
            label="Today's revenue"
            value={`₹${stats.todayRevenue.toFixed(2)}`}
            accent
          />

          <StatCard
            icon={ShoppingCart}
            label="Active carts"
            value={stats.activeCarts.toString()}
          />

          <StatCard
            icon={AlertCircle}
            label="Low stock"
            value={stats.lowStock.toString()}
            warn={stats.lowStock > 0}
            action={(
              <Dialog open={isLowStockOpen} onOpenChange={setIsLowStockOpen}>
                <DialogTrigger asChild>
                  <Button type="button" size="sm" variant="secondary" className="h-7 rounded-full px-3 text-[11px]">
                    View
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl rounded-3xl">
                  <DialogHeader>
                    <DialogTitle>Low-stock products</DialogTitle>
                    <DialogDescription>Products that are at or below their reorder threshold.</DialogDescription>
                  </DialogHeader>

                  {products.filter((product) => product.stock <= product.reorderLevel).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No low-stock products right now.</p>
                  ) : (
                    <div className="max-h-[70vh] overflow-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                            <th className="py-2">Product</th>
                            <th className="py-2">Category</th>
                            <th className="py-2 text-right">Stock</th>
                            <th className="py-2 text-right">Reorder</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products
                            .filter((product) => product.stock <= product.reorderLevel)
                            .map((product) => (
                              <tr
                                key={product.id}
                                className={cn(
                                  "border-b border-border/50 last:border-0",
                                  product.stock === 0
                                    ? "bg-red-50/80"
                                    : "bg-yellow-50/80",
                                )}
                              >
                                <td className="py-3 font-medium">{normalizeProductName(product.name)}</td>
                                <td className="py-3 text-muted-foreground">{product.category ?? "General"}</td>
                                <td className="py-3 text-right tabular-nums">{product.stock}</td>
                                <td className="py-3 text-right tabular-nums">{product.reorderLevel}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            )}
          />
          <StatCard
            icon={TrendingUp}
            label="Orders"
            value={stats.totalOrders.toString()}
            action={(
              <Dialog open={isOrdersOpen} onOpenChange={setIsOrdersOpen}>
                <DialogTrigger asChild>
                  <Button type="button" size="sm" variant="secondary" className="h-7 rounded-full px-3 text-[11px]">
                    View
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl rounded-3xl">
                  <DialogHeader>
                    <DialogTitle>Your orders</DialogTitle>
                    <DialogDescription>All transactions for this vendor are listed here.</DialogDescription>
                  </DialogHeader>

                  {transactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No transactions yet.</p>
                  ) : (
                    <div className="max-h-[70vh] overflow-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                            <th className="py-2">Order</th>
                            <th className="py-2">Date</th>
                            <th className="py-2">Items</th>
                            <th className="py-2 text-right">Amount</th>
                            <th className="py-2 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((transaction) => (
                            <tr key={transaction.id} className="border-b border-border/50 last:border-0">
                              <td className="py-3 font-medium">#{transaction.id}</td>
                              <td className="py-3 text-muted-foreground">
                                {new Date(transaction.createdAt).toLocaleString([], {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </td>
                              <td className="py-3 text-muted-foreground">
                                <div className="max-w-xs truncate">{transaction.itemSummary}</div>
                                <div className="text-[11px] text-muted-foreground/80">{transaction.itemCount} units</div>
                              </td>
                              <td className="py-3 text-right font-semibold tabular-nums">₹{Number(transaction.total).toFixed(2)}</td>
                              <td className="py-3 text-right">
                                <span className={cn(
                                  "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                  transaction.paymentStatus === "paid"
                                    ? "bg-success/10 text-success"
                                    : transaction.paymentStatus === "pending"
                                      ? "bg-warning/15 text-warning"
                                      : "bg-destructive/10 text-destructive",
                                )}>{transaction.paymentStatus}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            )}
          />

        </div>

        {/* --------------------------------------------------------------- */}
        {/* CHARTS                                                          */}
        {/* --------------------------------------------------------------- */}

        <div className="grid gap-4 md:grid-cols-2">

          <section className="rounded-2xl bg-white p-5 shadow-card">

            <h2 className="mb-4 font-display text-base font-bold">
              Revenue - last 7 days
            </h2>

            <div className="h-56">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart data={daily}>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />

                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                  />

                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                  />

                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border:
                        "1px solid hsl(var(--border))",
                      background:
                        "hsl(var(--card))",
                    }}
                    formatter={(value: number) => [
                      `₹${Number(value).toFixed(2)}`,
                      "Revenue",
                    ]}
                  />

                  <Bar
                    dataKey="revenue"
                    fill="hsl(var(--primary))"
                    radius={[8, 8, 0, 0]}
                  />

                </BarChart>
              </ResponsiveContainer>

            </div>

          </section>

          {/* ------------------------------------------------------------- */}
          {/* POPULAR PRODUCTS                                              */}
          {/* ------------------------------------------------------------- */}

          <section className="rounded-2xl bg-white p-5 shadow-card">

            <h2 className="mb-4 font-display text-base font-bold">
              Popular products
            </h2>

            {popular.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Popular-product analytics will appear after order data is available.
              </p>
            ) : (
              <ul className="space-y-2">

                {popular.map((product, index) => (
                  <li
                    key={product.name}
                    className="flex items-center gap-3 rounded-xl bg-surface-green p-3"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full gradient-primary text-xs font-bold text-primary-foreground">
                      {index + 1}
                    </span>

                    <span className="flex-1 truncate text-sm font-medium">
                      {normalizeProductName(
                        product.name,
                      )}
                    </span>

                    <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                      {product.sold} units
                    </span>
                  </li>
                ))}

              </ul>
            )}

          </section>

        </div>

        {/* --------------------------------------------------------------- */}
        {/* INVENTORY TABLE                                                 */}
        {/* --------------------------------------------------------------- */}

        <section className="rounded-2xl bg-white p-5 shadow-card">

          <div className="mb-4 flex items-center gap-2">

            <Package className="h-4 w-4 text-primary" />

            <h2 className="font-display text-base font-bold">
              Inventory
            </h2>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">

                  <th className="py-2">
                    Product
                  </th>

                  <th className="py-2">
                    Category
                  </th>

                  <th className="py-2 text-right">
                    Price
                  </th>

                  <th className="py-2 text-right">
                    Stock
                  </th>

                  <th className="py-2 text-right">
                    Status
                  </th>

                </tr>
              </thead>

              <tbody>

                {products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No products found.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {

                    const out =
                      product.stock === 0;

                    const low =
                      !out &&
                      product.stock <=
                        product.reorderLevel;

                    return (
                      <tr
                        key={product.id}
                        className={cn(
                          "border-b border-border/50 last:border-0",
                          out
                            ? "bg-red-50/90"
                            : low
                              ? "bg-yellow-50/90"
                              : "",
                        )}
                      >

                        <td className="py-3 font-medium">
                          {normalizeProductName(
                            product.name,
                          )}
                        </td>

                        <td className="py-3 text-muted-foreground">
                          {product.category}
                        </td>

                        <td className="py-3 text-right tabular-nums">
                          ₹
                          {Number(
                            product.price,
                          ).toFixed(2)}
                        </td>

                        <td className="py-3 text-right tabular-nums">
                          {product.stock}
                        </td>

                        <td className="py-3 text-right">

                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",

                              out
                                ? "bg-destructive/10 text-destructive"
                                : low
                                  ? "bg-warning/15 text-warning"
                                  : "bg-success/10 text-success",
                            )}
                          >
                            {out
                              ? "Out"
                              : low
                                ? "Low"
                                : "OK"}
                          </span>

                        </td>

                      </tr>
                    );
                  })
                )}

              </tbody>

            </table>

          </div>

        </section>

        {/* --------------------------------------------------------------- */}
        {/* LOGOUT                                                          */}
        {/* --------------------------------------------------------------- */}

        <Dialog open={isLogoutConfirmOpen} onOpenChange={setIsLogoutConfirmOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle>Confirm logout</DialogTitle>
              <DialogDescription>
                Are you sure you want to log out from the admin panel?
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsLogoutConfirmOpen(false)}
                disabled={isLoggingOut}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-red-600 hover:bg-red-700"
                onClick={confirmLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? "Logging out..." : "Logout"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </main>
    </AppShell>
  );
}

/* -------------------------------------------------------------------------- */
/*                              STAT CARD                                     */
/* -------------------------------------------------------------------------- */

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  warn,
  action,
}: {
  icon: any;
  label: string;
  value: string;
  accent?: boolean;
  warn?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className={cn(
        "w-full rounded-2xl p-4 shadow-card",
        accent
          ? "gradient-primary text-primary-foreground"
          : warn
            ? "bg-destructive/10"
            : "bg-card",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon
            className={cn(
              "h-4 w-4",
              accent
                ? ""
                : warn
                  ? "text-destructive"
                  : "text-primary",
            )}
          />

          <span
            className={cn(
              "text-xs font-semibold uppercase tracking-wider",
              accent ? "" : "text-muted-foreground",
            )}
          >
            {label}
          </span>
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <p className="mt-2 font-display text-2xl font-extrabold tabular-nums">
        {value}
      </p>
    </motion.div>
  );
}