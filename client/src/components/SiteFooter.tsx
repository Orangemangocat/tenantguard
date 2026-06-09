import { Link } from "wouter";
import { Scale } from "lucide-react";
import { BRAND } from "@/lib/assets";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-[var(--brand-navy)] text-white/80">
      <div className="container grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Scale className="h-5 w-5" />
            </span>
            <span className="font-display text-xl font-extrabold">{BRAND.name}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            Connecting tenants facing eviction with vetted, affordable attorneys —
            and giving attorneys a steady stream of qualified, paying clients.
          </p>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">
            For Attorneys
          </h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/attorney" className="hover:text-white">Attorney Portal</Link></li>
            <li><a href="/#pricing" className="hover:text-white">Pricing</a></li>
            <li><a href="/#how-it-works" className="hover:text-white">How Bidding Works</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">
            For Tenants
          </h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/tenant" className="hover:text-white">Get Help Now</Link></li>
            <li><Link href="/client" className="hover:text-white">Client Dashboard</Link></li>
            <li><Link href="/get-started" className="hover:text-white">Free Eligibility Check</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">
            Company
          </h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><a href="/#why" className="hover:text-white">Our Mission</a></li>
            <li><a href="mailto:hello@tenantguard.net" className="hover:text-white">Contact</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-2 py-6 text-xs text-white/50 sm:flex-row">
          <span>© {new Date().getFullYear()} {BRAND.name} · {BRAND.domain}</span>
          <span>
            TenantGuard is not a law firm and does not provide legal advice. Attorneys
            are independent and solely responsible for the legal services they provide.
          </span>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
