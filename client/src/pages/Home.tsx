import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarClock,
  CheckCircle2,
  FileSearch,
  Gavel,
  HandCoins,
  Scale,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ChatWidget from "@/components/ChatWidget";
import { ASSETS } from "@/lib/assets";
import { PRICING } from "@shared/appConstants";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] as const },
};

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `url(${ASSETS.heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="container relative grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              <BadgeCheck className="h-3.5 w-3.5" /> Now serving Davidson County, TN
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
              A steady stream of{" "}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10">paying clients</span>
                <span className="absolute -bottom-1 left-0 z-0 h-3 w-full bg-primary/30" />
              </span>{" "}
              who actually need you.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              TenantGuard pre-screens tenants facing eviction, packages their case
              file and court history, and hands you a ready-to-represent client.
              You set a flat fee. No ad spend. No chasing leads.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-13 bg-primary px-7 text-base font-bold text-primary-foreground hover:bg-[var(--brand-orange-strong)]"
                onClick={() => navigate("/attorney")}
              >
                Enter the Attorney Portal <ArrowRight className="ml-1 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-13 bg-background px-7 text-base font-semibold"
                onClick={() => {
                  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                See how it works
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Flat-fee, one-time pricing</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Verified court records</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> No subscriptions</span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="relative"
          >
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-primary/20 to-transparent blur-2xl" />
            <img
              src={ASSETS.heroDashboard}
              alt="TenantGuard attorney dashboard preview"
              className="w-full rounded-2xl border border-border shadow-2xl"
            />
          </motion.div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-y border-border bg-secondary/50">
        <div className="container grid grid-cols-2 gap-6 py-8 text-center md:grid-cols-4">
          {[
            { n: "1 in 10", l: "tenants have counsel in eviction court" },
            { n: "90%", l: "of landlords show up represented" },
            { n: "$0", l: "advertising cost passed to your clients" },
            { n: "48 hrs", l: "typical time to a represented client" },
          ].map((s) => (
            <div key={s.l}>
              <div className="font-display text-3xl font-extrabold text-[var(--brand-navy)]">{s.n}</div>
              <div className="mt-1 text-xs leading-snug text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* WHY — the under-representation argument */}
      <section id="why" className="py-20">
        <div className="container grid gap-12 lg:grid-cols-2">
          <motion.div {...fadeUp}>
            <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
              Why qualified tenants go{" "}
              <span className="text-primary">unrepresented</span>
            </h2>
            <div className="mt-6 space-y-5 text-muted-foreground">
              <p className="leading-relaxed">
                The problem isn't a shortage of tenants who can pay a fair, flat fee —
                it's <strong className="text-foreground">the cost of finding them.</strong>{" "}
                Traditional client acquisition for an eviction-defense practice runs on
                advertising, intake staff, and unpaid consultations. Those costs get
                baked into the fee, pricing out the very tenants who could otherwise afford counsel.
              </p>
              <p className="leading-relaxed">
                So otherwise-qualified tenants represent themselves, lose by default, and
                attorneys never even hear about the case. Everyone loses.
              </p>
              <p className="leading-relaxed">
                <strong className="text-foreground">TenantGuard removes the acquisition cost.</strong>{" "}
                We do the screening, document collection, and court-record lookups up front.
                You see a complete file and decide whether to bid — your fee reflects the work,
                not the marketing.
              </p>
            </div>
          </motion.div>

          <motion.div {...fadeUp} className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: HandCoins, t: "No ad spend in your fee", d: "Your flat fee covers representation, not customer acquisition." },
              { icon: FileSearch, t: "Pre-built case files", d: "Lease, notices, and tenant statement collected before you bid." },
              { icon: Building2, t: "Landlord history surfaced", d: "We pull prior filings by the same landlord automatically." },
              { icon: Users, t: "Pre-qualified tenants", d: "Clients have paid onboarding — they're committed and reachable." },
            ].map((c) => (
              <Card key={c.t} className="border-border p-5">
                <c.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-3 font-display text-base font-bold">{c.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
              </Card>
            ))}
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="border-y border-border bg-secondary/40 py-20">
        <div className="container">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
              How TenantGuard works for attorneys
            </h2>
            <p className="mt-4 text-muted-foreground">
              From a verified profile to a represented client in four steps.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-6 md:grid-cols-4">
            {[
              { icon: ShieldCheck, t: "1. Verify credentials", d: "Submit your bar number, admission year, and the counties you practice in. We confirm good standing." },
              { icon: FileSearch, t: "2. Browse real cases", d: "Review pre-screened tenant files with documents and the landlord's prior court actions." },
              { icon: Gavel, t: "3. Bid a flat fee", d: `Set one fee for the first two appearances and a separate fee for a third. Buy access at $${PRICING.ATTORNEY_PER_CLIENT}/client.` },
              { icon: CalendarClock, t: "4. Get retained", d: "Clients accept your bid, can book a paid 30-minute call, and you take it from there." },
            ].map((s, i) => (
              <motion.div
                key={s.t}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08, ease: [0.23, 1, 0.32, 1] }}
              >
                <Card className="h-full border-border p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-navy)] text-white">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold">{s.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20">
        <div className="container">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent-foreground">
              One-time fee · No strings attached
            </span>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
              Simple, honest pricing
            </h2>
            <p className="mt-4 text-muted-foreground">
              No subscriptions that renew year after year. You pay for client access; tenants
              pay one onboarding fee. That's it.
            </p>
          </motion.div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
            <Card className="relative overflow-hidden border-2 border-primary p-8">
              <div className="absolute right-0 top-0 bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                FOR ATTORNEYS
              </div>
              <Scale className="h-8 w-8 text-primary" />
              <h3 className="mt-4 font-display text-2xl font-extrabold">Client Access</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-5xl font-extrabold">${PRICING.ATTORNEY_PER_CLIENT}</span>
                <span className="text-muted-foreground">/ client</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {PRICING.ATTORNEY_MIN_CLIENTS}-client minimum (${PRICING.ATTORNEY_PER_CLIENT * PRICING.ATTORNEY_MIN_CLIENTS} to start).
                You set your own representation fees on top.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Full case files + uploaded documents",
                  "Landlord court-history (CaseLink) lookups",
                  "Flat-fee bidding: first two appearances + third",
                  "Direct client messaging & paid consults",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-8 h-12 w-full bg-primary text-base font-bold text-primary-foreground hover:bg-[var(--brand-orange-strong)]"
                onClick={() => navigate("/attorney")}
              >
                Enter the Attorney Portal
              </Button>
            </Card>

            <Card className="border-border p-8">
              <div className="absolute right-0 top-0 bg-[var(--brand-navy)] px-3 py-1 text-xs font-bold text-white">
                FOR TENANTS
              </div>
              <ShieldCheck className="h-8 w-8 text-[var(--brand-navy)]" />
              <h3 className="mt-4 font-display text-2xl font-extrabold">Tenant Onboarding</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-5xl font-extrabold">${PRICING.CLIENT_ONBOARDING}</span>
                <span className="text-muted-foreground">one-time</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Tenants pay this to get screened, matched, and represented. Funds a real defense.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Guided intake + document upload",
                  "Matched with verified local attorneys",
                  "Review competing flat-fee bids",
                  `30-min attorney call for $${PRICING.CONSULTATION_FEE} (credited to fees)`,
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-navy)]" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                className="mt-8 h-12 w-full bg-background text-base font-semibold"
                onClick={() => navigate("/tenant")}
              >
                See the tenant experience
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[var(--brand-navy)] py-20 text-white">
        <div className="container relative grid items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
              Build a defense practice that pays — without the ad budget.
            </h2>
            <p className="mt-4 max-w-lg text-white/70">
              Create your verified attorney profile and start reviewing real Davidson
              County cases today.
            </p>
            <Button
              size="lg"
              className="mt-8 h-13 bg-primary px-8 text-base font-bold text-primary-foreground hover:bg-[var(--brand-orange-strong)]"
              onClick={() => navigate("/attorney")}
            >
              Enter the Attorney Portal <ArrowRight className="ml-1 h-5 w-5" />
            </Button>
          </div>
          <img
            src={ASSETS.courtroom}
            alt="Attorney representing a client in court"
            className="hidden rounded-2xl border border-white/10 shadow-2xl md:block"
          />
        </div>
      </section>

      <SiteFooter />
      <ChatWidget />
    </div>
  );
}
