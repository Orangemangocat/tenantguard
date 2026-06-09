import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Scale,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/assets";

/**
 * Standalone single-page click-through ad landing page.
 * Designed to receive traffic from a Facebook / Instagram video ad.
 * 5-step emotional narrative arc: crisis -> recognition -> hope -> proof -> action.
 * No site header/footer — this is a focused conversion page.
 */

const ease = [0.23, 1, 0.32, 1] as const;

const STEPS = [
  {
    key: "crisis",
    icon: <AlertTriangle className="h-7 w-7" />,
    tag: "Got an eviction notice?",
    headline: "A notice on your door isn't the end of your story.",
    body: "Most tenants never get to tell their side — not because they're wrong, but because they think they can't afford a lawyer. Landlords show up with attorneys. You shouldn't have to stand alone.",
    accent: "from-red-500/20 to-orange-500/10",
  },
  {
    key: "recognition",
    icon: <Heart className="h-7 w-7" />,
    tag: "You're not the problem",
    headline: "The system is stacked — and the cost of finding a lawyer gets passed to you.",
    body: "Traditional firms spend a fortune on advertising, and that cost lands on the tenant who can least afford it. That's exactly why qualified tenants go unrepresented. We built TenantGuard to break that cycle.",
    accent: "from-amber-500/20 to-yellow-500/10",
  },
  {
    key: "hope",
    icon: <ShieldCheck className="h-7 w-7" />,
    tag: "How TenantGuard helps",
    headline: "Vetted local attorneys. Flat fees. No surprises.",
    body: "Tell us your story once. Verified attorneys licensed in your county review your case and send flat-fee offers to represent you — a fixed price for your first two court appearances, with a clear price for a third if it's ever needed.",
    accent: "from-emerald-500/20 to-teal-500/10",
  },
  {
    key: "proof",
    icon: <Scale className="h-7 w-7" />,
    tag: "Real representation",
    headline: "Talk to an attorney for $25 — credited toward your fees.",
    body: "Book a 30-minute consultation with a bidding attorney for just $25, and that amount goes straight toward your representation. No retainers. No hourly meters running while you explain your situation.",
    accent: "from-sky-500/20 to-blue-500/10",
  },
  {
    key: "action",
    icon: <CheckCircle2 className="h-7 w-7" />,
    tag: "Take the first step",
    headline: "Start your case in minutes.",
    body: "It's free to tell your story and see who's ready to help. You only move forward when you're ready.",
    accent: "from-orange-500/20 to-primary/10",
  },
];

export default function AdLanding() {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  // Auto-advance subtly to keep momentum, but stop at the final CTA.
  useEffect(() => {
    if (isLast) return;
    const t = setTimeout(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 7000);
    return () => clearTimeout(t);
  }, [step, isLast]);

  const mainUrl = "/"; // links back to the main marketing site

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--brand-navy)] text-white">
      {/* Ambient animated background */}
      <motion.div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${current.accent}`}
        key={current.key}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease }}
      />
      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-1/4 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

      {/* Brand bar */}
      <div className="relative z-10 flex items-center gap-2 px-6 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Scale className="h-5 w-5" />
        </span>
        <span className="font-display text-lg font-extrabold">{BRAND.name}</span>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-72px)] max-w-2xl flex-col items-center justify-center px-6 pb-16 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.key}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.45, ease }}
            className="flex flex-col items-center"
          >
            <motion.div
              className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground"
              initial={{ rotate: -8, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.5, ease }}
            >
              {current.icon}
            </motion.div>
            <div className="mb-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80">
              {current.tag}
            </div>
            <h1 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">
              {current.headline}
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/80 sm:text-lg">{current.body}</p>
          </motion.div>
        </AnimatePresence>

        {/* CTA */}
        <div className="mt-10 flex w-full max-w-sm flex-col items-center gap-3">
          {isLast ? (
            <motion.a
              href={`${mainUrl}get-started`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease }}
              className="w-full"
            >
              <Button className="h-14 w-full bg-primary text-lg font-bold text-primary-foreground shadow-xl hover:bg-[var(--brand-orange-strong)]">
                Start my case — it's free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.a>
          ) : (
            <Button
              onClick={() => setStep((s) => s + 1)}
              className="h-12 w-full bg-white/15 text-base font-semibold text-white backdrop-blur hover:bg-white/25"
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {isLast && (
            <a href={mainUrl} className="text-sm text-white/60 underline-offset-4 hover:underline">
              Learn how TenantGuard works
            </a>
          )}

          {!isLast && (
            <button onClick={() => setStep(STEPS.length - 1)} className="text-sm text-white/50 underline-offset-4 hover:underline">
              Skip to get started
            </button>
          )}
        </div>

        {/* Progress dots */}
        <div className="mt-10 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              aria-label={`Go to step ${i + 1}`}
              onClick={() => setStep(i)}
              className={`h-2 rounded-full transition-all duration-300 ${i === step ? "w-8 bg-primary" : "w-2 bg-white/30"}`}
            />
          ))}
        </div>

        {/* Trust footer */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/50">
          <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Bar-verified attorneys</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Offers in 24–48 hrs</span>
          <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Flat fees, no retainers</span>
        </div>
      </div>
    </div>
  );
}
