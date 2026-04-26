import { NavLink, useLocation } from "react-router-dom";
import { Home, Tag, Receipt, LayoutDashboard, Sparkles } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const items = [
  { title: "Home", url: "/", icon: Home },
  { title: "Offers", url: "/offers", icon: Tag, accent: true },
  { title: "Orders", url: "/orders", icon: Receipt },
  { title: "Admin", url: "/admin", icon: LayoutDashboard },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/20">
      <SidebarHeader className="border-b border-sidebar-border/30 px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-accent shadow-soft">
            <Sparkles className="h-5 w-5 text-sidebar-primary" />
          </div>
          {!collapsed && (
            <div>
              <p className="font-display text-base font-bold leading-tight text-sidebar-foreground">
                Smart<span className="text-primary-glow">Shop</span>
              </p>
              <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">RFID cart</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2.5">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50">
              Navigate
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item) => {
                const isHome = item.url === "/";
                const active = isHome ? pathname === "/" : pathname.startsWith(item.url);
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      className={cn(
                        "h-12 rounded-xl px-2.5 text-sm transition-all",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-soft"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                        item.accent && !active && "bg-pink/10 text-pink hover:bg-pink/20 hover:text-pink"
                      )}
                    >
                      <NavLink to={item.url} end={isHome}>
                        <Icon className={cn("h-5 w-5", item.accent && !active && "text-pink")} />
                        {!collapsed && (
                          <span className="flex items-center gap-2">
                            {item.title}
                            {item.accent && (
                              <span className="rounded-full bg-pink px-1.5 py-0.5 text-[9px] font-bold text-pink-foreground">
                                NEW
                              </span>
                            )}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/30 p-3">
        {!collapsed ? (
          <div className="rounded-xl bg-sidebar-accent/50 p-3">
            <p className="text-xs font-semibold text-sidebar-foreground">Need help?</p>
            <p className="mt-0.5 text-[10px] text-sidebar-foreground/60">Wave to a store assistant.</p>
          </div>
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-accent/40 text-sidebar-foreground/70">
            ?
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
