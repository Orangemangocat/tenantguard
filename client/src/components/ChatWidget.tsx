import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, MessageSquare, Scale, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { CONTACT_REASONS } from "@shared/appConstants";

type Msg = { role: "bot" | "user"; text: string; at: number };

const GREETING =
  "Hi there! We're currently outside of business hours. Leave your information and a message, and a TenantGuard specialist will follow up by email as soon as possible.";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0); // 0 name, 1 email, 2 reason, 3 message, 4 done
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState<string>("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "bot", text: GREETING, at: Date.now() },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const submit = trpc.misc.submitChatIntake.useMutation();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, step, open]);

  const push = (m: Msg) => setMessages((prev) => [...prev, m]);

  const next = () => {
    if (step === 0) {
      if (!name.trim()) return;
      push({ role: "user", text: name, at: Date.now() });
      setStep(1);
    } else if (step === 1) {
      if (!email.trim()) return;
      push({ role: "user", text: email, at: Date.now() });
      setStep(2);
    } else if (step === 2) {
      if (!reason) return;
      push({ role: "user", text: reason, at: Date.now() });
      setStep(3);
    } else if (step === 3) {
      if (!message.trim()) return;
      push({ role: "user", text: message, at: Date.now() });
      const transcript: Msg[] = [
        ...messages,
        { role: "user", text: message, at: Date.now() },
      ];
      submit.mutate({
        name,
        email,
        contactReason: reason,
        message,
        transcript: transcript.map((m) => ({ role: m.role, text: m.text, at: m.at })),
      });
      setStep(4);
      setTimeout(() => {
        push({
          role: "bot",
          text: "Thanks! We'll get back to you by email during business hours (Mon–Fri, 9am–6pm CST). In the meantime, feel free to start your tenant intake from the homepage.",
          at: Date.now(),
        });
      }, 500);
    }
  };

  const label = ["Name", "Email", "Contact Reason", "Please describe what you need help with"][step] ?? "";

  return (
    <>
      {/* Launcher */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              style={{ transformOrigin: "bottom right" }}
              className="flex h-[32rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between bg-[var(--brand-navy)] px-4 py-3 text-white">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--brand-navy)]">
                    <Scale className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-sm font-bold leading-tight">TenantGuard Support</div>
                    <div className="text-[11px] text-white/70">Live chat Mon–Fri · 9am–6pm CST</div>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} aria-label="Minimize">
                  <ChevronDown className="h-5 w-5" />
                </button>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-secondary/30 px-4 py-4">
                {messages.map((m, i) => (
                  <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                    <div
                      className={
                        m.role === "user"
                          ? "max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground"
                          : "max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm text-foreground"
                      }
                    >
                      {m.text}
                    </div>
                  </div>
                ))}

                {/* Active input card */}
                {step < 4 && (
                  <div className="rounded-xl border border-border bg-background p-3 shadow-sm">
                    <label className="text-xs font-bold text-foreground">{label}</label>
                    <div className="mt-2">
                      {step === 0 && (
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
                          onKeyDown={(e) => e.key === "Enter" && next()} autoFocus />
                      )}
                      {step === 1 && (
                        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                          onKeyDown={(e) => e.key === "Enter" && next()} autoFocus />
                      )}
                      {step === 2 && (
                        <Select value={reason} onValueChange={setReason}>
                          <SelectTrigger><SelectValue placeholder="Choose a reason" /></SelectTrigger>
                          <SelectContent>
                            {CONTACT_REASONS.map((r) => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {step === 3 && (
                        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe your situation…" rows={3} autoFocus />
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">{step + 1} of 4</span>
                      <Button size="sm" onClick={next} className="font-semibold" disabled={submit.isPending}>
                        {step === 3 ? "Send" : "Next"} <Send className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <div className="border-t border-border px-3 py-2 text-center text-[10px] text-muted-foreground">
                Secured by TenantGuard · we never share your information
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
          aria-label="Open chat"
        >
          {open ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        </button>
      </div>
    </>
  );
}

export default ChatWidget;
