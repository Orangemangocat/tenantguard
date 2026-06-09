import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LogOut, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { BRAND } from "@/lib/assets";

type NavItem = { label: string; href: string; icon: ReactNode };

export function PortalLayout({
  title,
  nav,
  children,
}: {
  title: string;
  nav: NavItem[];
  children: ReactNode;
}) {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-secondary/30">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-[var(--brand-navy)] text-white md:flex">
        <Link href="/" className="flex items-center gap-2 px-6 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Scale className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-extrabold">{BRAND.name}</span>
        </Link>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {nav.map((item) => {
            const active = location === item.href;
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 truncate text-xs text-white/60">{user?.email ?? user?.name}</div>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-white/20 bg-transparent text-white hover:bg-white/10"
            onClick={async () => {
              await logout();
              navigate("/");
            }}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-6">
          <h1 className="font-display text-xl font-bold">{title}</h1>
          <div className="flex items-center gap-2 md:hidden">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>Home</Button>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

export default PortalLayout;
