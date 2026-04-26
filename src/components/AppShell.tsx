import { ReactNode } from "react";
import { User, ArrowRight, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";

interface Props { children: ReactNode }

function HamburgerTrigger() {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label="Toggle sidebar"
      className="flex h-11 w-11 items-center justify-center rounded-full text-dark-green transition hover:bg-secondary active:scale-95"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}

export function AppShell({ children }: Props) {
  const { items, totals } = useCart();
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-[70px] items-center gap-3 border-b border-border/70 bg-surface-green/60 px-4 backdrop-blur-md md:px-6">
            <HamburgerTrigger />

            <Link
              to="/"
              className="mr-2 hidden items-center gap-2 lg:flex"
            >
              <span className="font-display text-lg font-bold text-dark-green">
                Smart<span className="text-primary">Shop</span>
              </span>
            </Link>

            <div className="ml-auto flex items-center gap-2">
              {count > 0 && (
                <Button asChild variant="hero" size="default" className="h-12 px-6 text-sm">
                  <Link to="/checkout">
                    Checkout · ${totals.total.toFixed(2)}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
              <button
                type="button"
                className="hidden h-11 w-11 items-center justify-center rounded-xl bg-card text-dark-green shadow-soft transition hover:bg-accent md:flex"
                aria-label="Account"
              >
                <User className="h-5 w-5" />
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
