import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, Scale, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { BRAND } from "@/lib/assets";

const NAV = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Why TenantGuard", href: "/#why" },
  { label: "Pricing", href: "/#pricing" },
  { label: "For Tenants", href: "/tenant" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();

  const portalHref = isAuthenticated
    ? user?.role === "client"
      ? "/client"
      : "/attorney"
    : getLoginUrl();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand-navy)] text-white">
            <Scale className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight">
            {BRAND.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <Button onClick={() => navigate(portalHref)} className="font-semibold">
              My Dashboard
            </Button>
          ) : (
            <>
              <a href={getLoginUrl()}>
                <Button variant="ghost" className="font-medium">
                  Log in
                </Button>
              </a>
              <Button
                onClick={() => navigate("/attorney")}
                className="bg-primary font-semibold text-primary-foreground hover:bg-[var(--brand-orange-strong)]"
              >
                Attorney Portal
              </Button>
            </>
          )}
        </div>

        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-md md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="container flex flex-col gap-1 py-4">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <a href={getLoginUrl()}>
                <Button variant="outline" className="w-full">
                  Log in
                </Button>
              </a>
              <Button
                className="w-full bg-primary font-semibold text-primary-foreground"
                onClick={() => {
                  setOpen(false);
                  navigate("/attorney");
                }}
              >
                Attorney Portal
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default SiteHeader;
