import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Check, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import SiteHeader from "@/components/SiteHeader";
import { JURISDICTIONS } from "@shared/appConstants";

const CASE_TYPES = [
  "Eviction - Non Payment of Rent",
  "Eviction - Lease Violation",
  "Eviction - Holdover / No Cause",
  "Illegal Lockout",
  "Uninhabitable Conditions",
  "Security Deposit Dispute",
  "Other Housing Issue",
];

const STEPS = ["Your situation", "Property & landlord", "Tell your story", "Review"];

export default function GetStarted() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    tenantName: "",
    caseType: "",
    propertyAddress: "",
    county: JURISDICTIONS[0],
    state: "TN",
    monthlyRent: "",
    landlordName: "",
    caseSummary: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const create = trpc.clientPortal.createCase.useMutation({
    onSuccess: (c) => {
      toast.success("Case created. Let's get you matched.");
      if (c?.id) navigate(`/client/case/${c.id}`);
      else navigate("/client");
    },
    onError: (e) => toast.error(e.message),
  });

  const canNext = () => {
    if (step === 0) return form.tenantName && form.caseType;
    if (step === 1) return form.propertyAddress && form.county && form.state;
    if (step === 2) return form.caseSummary.length > 10;
    return true;
  };

  const submit = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    create.mutate({
      tenantName: form.tenantName,
      caseType: form.caseType,
      propertyAddress: form.propertyAddress,
      county: form.county,
      state: form.state,
      monthlyRent: form.monthlyRent ? Number(form.monthlyRent) : undefined,
      landlordName: form.landlordName || undefined,
      caseSummary: form.caseSummary,
    });
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <SiteHeader />
      <div className="container max-w-2xl py-10">
        {/* Stepper */}
        <div className="mb-8 flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 items-center">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                i < step ? "bg-primary text-primary-foreground" : i === step ? "bg-[var(--brand-navy)] text-white" : "bg-secondary text-muted-foreground"
              }`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`mx-2 h-0.5 flex-1 ${i < step ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <Card className="p-6 sm:p-8">
          <h1 className="font-display text-2xl font-extrabold">{STEPS[step]}</h1>

          {step === 0 && (
            <div className="mt-6 space-y-5">
              <div>
                <Label htmlFor="name">Your full name *</Label>
                <Input id="name" className="mt-1.5" value={form.tenantName} onChange={(e) => set("tenantName", e.target.value)} placeholder="Jordan Rivera" />
              </div>
              <div>
                <Label>What kind of issue are you facing? *</Label>
                <Select value={form.caseType} onValueChange={(v) => set("caseType", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select a case type" /></SelectTrigger>
                  <SelectContent>
                    {CASE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="mt-6 space-y-5">
              <div>
                <Label htmlFor="addr">Property address *</Label>
                <Input id="addr" className="mt-1.5" value={form.propertyAddress} onChange={(e) => set("propertyAddress", e.target.value)} placeholder="123 Main St, Apt 4, Nashville" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>County *</Label>
                  <Select value={form.county} onValueChange={(v) => set("county", v)}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {JURISDICTIONS.map((j) => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input id="state" className="mt-1.5" value={form.state} onChange={(e) => set("state", e.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="rent">Monthly rent ($)</Label>
                  <Input id="rent" type="number" className="mt-1.5" value={form.monthlyRent} onChange={(e) => set("monthlyRent", e.target.value)} placeholder="1200" />
                </div>
                <div>
                  <Label htmlFor="ll">Landlord / property manager</Label>
                  <Input id="ll" className="mt-1.5" value={form.landlordName} onChange={(e) => set("landlordName", e.target.value)} placeholder="Maple Grove Properties LLC" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="mt-6 space-y-3">
              <Label htmlFor="story">Describe what's happening *</Label>
              <Textarea id="story" rows={7} value={form.caseSummary} onChange={(e) => set("caseSummary", e.target.value)}
                placeholder="Include dates, any notices you received, and what you'd like help with. The more detail, the better attorneys can help." />
              <p className="text-xs text-muted-foreground">{form.caseSummary.length} characters</p>
            </div>
          )}

          {step === 3 && (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border border-border p-4 text-sm">
                <Row label="Name" value={form.tenantName} />
                <Row label="Issue" value={form.caseType} />
                <Row label="Address" value={form.propertyAddress} />
                <Row label="County" value={`${form.county}, ${form.state}`} />
                {form.monthlyRent && <Row label="Rent" value={`$${form.monthlyRent}/mo`} />}
                {form.landlordName && <Row label="Landlord" value={form.landlordName} />}
                <div className="mt-2 border-t border-border pt-2">
                  <div className="text-muted-foreground">Summary</div>
                  <p className="mt-1">{form.caseSummary}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-accent p-3 text-sm">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>After submitting, you'll complete a one-time $250 onboarding so vetted local attorneys can send flat-fee offers.</span>
              </div>
              {!isAuthenticated && !loading && (
                <p className="text-sm text-muted-foreground">You'll be asked to sign in to save your case.</p>
              )}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button className="bg-primary font-semibold text-primary-foreground" disabled={!canNext()} onClick={() => setStep((s) => s + 1)}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button className="bg-primary font-bold text-primary-foreground hover:bg-[var(--brand-orange-strong)]"
                disabled={create.isPending} onClick={submit}>
                {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit my case
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
