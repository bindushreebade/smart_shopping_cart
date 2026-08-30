import { ReactNode } from "react";
import { ArrowRight, Home, Tag, Receipt, LayoutDashboard } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";

interface Props { children: ReactNode }

const navItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Offers", url: "/offers", icon: Tag, accent: true },
  { title: "Orders", url: "/orders", icon: Receipt },
  { title: "Admin", url: "/admin", icon: LayoutDashboard },
];

export function AppShell({ children }: Props) {
  const { items, totals } = useCart();
  const count = items.reduce((s, i) => s + i.quantity, 0);
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-[70px] items-center gap-3 border-b border-border/70 bg-surface-green/60 px-4 backdrop-blur-md md:px-6">
        <Link
          to="/"
          className="flex items-center gap-2"
        >
          <span className="font-display text-3xl font-extrabold text-dark-green">
            Smart<span className="text-primary">Shop</span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-12 md:gap-14">
          <nav className="flex items-center gap-12 md:gap-14">
            {navItems.map((item) => {
              const isHome = item.url === "/";
              const active = isHome ? pathname === "/" : pathname.startsWith(item.url);
              const Icon = item.icon;
              return (
                <Link
                  key={item.url}
                  to={item.url}
                  className={cn(
                    "group flex flex-col items-center gap-1 px-1 py-1 text-xs font-semibold transition-all duration-200",
                    "hover:scale-110 active:scale-95",
                    active 
                      ? "text-dark-green" 
                      : item.accent && !active
                      ? "text-pink"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <div className="flex items-center gap-0.5">
                    <Icon className={cn(
                      "h-6 w-6 transition-all duration-200",
                      active && "drop-shadow-md"
                    )} />
                    {item.accent && (
                      <span className="flex items-center justify-center rounded-lg bg-pink px-2 py-1 text-[8px] font-bold text-pink-foreground leading-none h-5 w-auto min-w-max">
                        NEW
                      </span>
                    )}
                  </div>
                  <span className="hidden sm:inline">{item.title}</span>
                </Link>
              );
            })}
          </nav>

          {count > 0 && (
            <Button asChild variant="hero" size="default" className="h-12 px-6 text-sm transition-all hover:scale-105 active:scale-95">
              <Link to="/checkout">
                Checkout · ₹{totals.total.toFixed(2)}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
