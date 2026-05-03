import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const { pathname } = useLocation();
  const tabs = [
    { to: "/", label: "Cart", icon: ShoppingCart },
    { to: "/admin", label: "Admin", icon: LayoutDashboard },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">

          <span className="font-display text-lg font-extrabold tracking-tight">Smart<span className="text-primary">Cart</span></span>
        </Link>
        <nav className="flex items-center gap-1 rounded-full bg-secondary p-1">
          {tabs.map(t => {
            const active = pathname === t.to;
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                  active ? "bg-card shadow-card text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
