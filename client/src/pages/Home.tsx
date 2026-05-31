import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
 * TenantGuard Click-Through Ad — "Found a notice on your door? Don't panic."
 * Design: Crisis-to-Calm emotional gradient. Simple click-through steps.
 * Each step is a full-viewport screen with one message and one action.
 */

const IMAGES = {
  noticeDoor: "https://d2xsxph8kpxj0f.cloudfront.net/310419663028482526/T7KbcqWrX6NAkfZuRUsXLh/notice-on-door-Zoqfj53hqgVeEyBXUEbZbK.webp",
  phoneScanning: "https://d2xsxph8kpxj0f.cloudfront.net/310419663028482526/T7KbcqWrX6NAkfZuRUsXLh/phone-scanning-EVYrN6PtqSxoZbRrPw4M5b.webp",
  shieldProtection: "https://d2xsxph8kpxj0f.cloudfront.net/310419663028482526/T7KbcqWrX6NAkfZuRUsXLh/shield-protection-SRgDQg3hLonzuZEbSre5br.webp",
  heroBg: "https://d2xsxph8kpxj0f.cloudfront.net/310419663028482526/T7KbcqWrX6NAkfZuRUsXLh/hero-bg-hSZJ5Bvd32XcZViohyp9WC.webp",
};

const steps = [
  {
    id: 0,
    bg: "bg-gradient-to-b from-amber-950 via-amber-900 to-amber-800",
    image: IMAGES.noticeDoor,
    headline: "Found a notice on your door?",
    subtext: "Don't panic.",
    cta: "What do I do?",
  },
  {
    id: 1,
    bg: "bg-gradient-to-b from-amber-800 via-amber-700 to-teal-800",
    image: IMAGES.phoneScanning,
    headline: "Just snap a photo of it.",
    subtext: "Upload it to TenantGuard. That's it. Takes 10 seconds.",
    cta: "Then what happens?",
  },
  {
    id: 2,
    bg: "bg-gradient-to-b from-teal-900 via-teal-800 to-slate-900",
    image: IMAGES.shieldProtection,
    headline: "Paige reads it instantly.",
    subtext: "Our AI analyzes your notice, identifies your rights, and tells you exactly what to do next — in plain English, not legal jargon.",
    cta: "What does that look like?",
  },
  {
    id: 3,
    bg: "bg-gradient-to-b from-slate-900 via-slate-800 to-teal-900",
    image: null,
    headline: "You get a clear action plan.",
    subtext: "Deadlines. Your rights. What to say. What NOT to do. Whether you need a lawyer — and if so, we connect you to one for free.",
    cta: "How much does this cost?",
  },
  {
    id: 4,
    bg: "bg-gradient-to-b from-teal-900 via-teal-800 to-teal-700",
    image: null,
    headline: "It's free.",
    subtext: "TenantGuard is free for tenants. Always. No credit card. No catch. We exist because everyone deserves to understand their rights.",
    cta: "Get Started Now",
    isFinal: true,
  },
];

export default function Home() {
  const [currentStep, setCurrentStep] = useState(0);

  const advance = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final CTA — link to TenantGuard
      window.open("https://tenantguard.net", "_blank");
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = steps[currentStep];

  return (
    <div className={`min-h-screen w-full ${step.bg} transition-colors duration-700 relative overflow-hidden`}>
      {/* Background image overlay for steps with images */}
      <AnimatePresence mode="wait">
        {step.image && (
          <motion.div
            key={`img-${step.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 z-0"
          >
            <img
              src={step.image}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {/* Progress dots */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-500 ${
                i === currentStep
                  ? "bg-white w-6"
                  : i < currentStep
                  ? "bg-white/60"
                  : "bg-white/25"
              }`}
            />
          ))}
        </div>

        {/* Back button */}
        {currentStep > 0 && (
          <button
            onClick={goBack}
            className="absolute top-8 left-6 text-white/70 hover:text-white transition-colors text-sm flex items-center gap-1"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="max-w-lg w-full text-center flex flex-col items-center gap-6"
          >
            {/* Shield icon on later steps */}
            {step.id >= 3 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="text-teal-400">
                  <path
                    d="M12 2L3 7V12C3 16.97 6.84 21.66 12 23C17.16 21.66 21 16.97 21 12V7L12 2Z"
                    fill="currentColor"
                    opacity="0.2"
                  />
                  <path
                    d="M12 2L3 7V12C3 16.97 6.84 21.66 12 23C17.16 21.66 21 16.97 21 12V7L12 2Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.div>
            )}

            {/* Headline */}
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white leading-tight">
              {step.headline}
            </h1>

            {/* Subtext */}
            <p className="text-lg md:text-xl text-white/80 leading-relaxed max-w-md">
              {step.subtext}
            </p>

            {/* CTA Button */}
            <motion.button
              onClick={advance}
              whileTap={{ scale: 0.97 }}
              className={`mt-8 px-8 py-4 rounded-full text-lg font-semibold transition-all duration-200 ${
                step.isFinal
                  ? "bg-teal-500 hover:bg-teal-400 text-white shadow-lg shadow-teal-500/30"
                  : "bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-sm"
              }`}
            >
              {step.cta}
            </motion.button>

            {/* TenantGuard branding */}
            <div className="mt-12 flex items-center gap-2 text-white/50">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L3 7V12C3 16.97 6.84 21.66 12 23C17.16 21.66 21 16.97 21 12V7L12 2Z"
                  fill="currentColor"
                  opacity="0.5"
                />
              </svg>
              <span className="text-sm font-medium tracking-wide">TenantGuard</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
