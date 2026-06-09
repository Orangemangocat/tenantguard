import { useState } from "react";
import { useLocation } from "wouter";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { JURISDICTIONS, PRIMARY_JURISDICTION } from "@shared/appConstants";

const STATES = ["TN", "AL", "AR", "GA", "KY", "MS", "MO", "NC", "VA"];
const currentYear = new Date().getFullYear();

export default function AttorneyOnboarding({ onDone }: { onDone?: () => void }) {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const save = trpc.attorney.saveProfile.useMutation({
    onSuccess: async () => {
      await utils.attorney.myProfile.invalidate();
      toast.success("Credentials verified. Welcome to TenantGuard.");
      onDone?.();
      navigate("/attorney");
    },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    fullName: "",
    firmName: "",
    phone: "",
    bio: "",
    barNumber: "",
    barState: "TN",
    yearAdmitted: "",
    goodStandingCertified: false,
  });
  const [jurisdictions, setJurisdictions] = useState<string[]>([PRIMARY_JURISDICTION]);

  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));
  const toggleJur = (j: string) =>
    setJurisdictions((prev) => (prev.includes(j) ? prev.filter((x) => x !== j) : [...prev, j]));

  const submit = () => {
    if (!form.fullName || !form.firmName || !form.barNumber || !form.yearAdmitted) {
      toast.error("Please complete all required fields.");
      return;
    }
    if (jurisdictions.length === 0) {
      toast.error("Select at least one county where you practice.");
      return;
    }
    if (!form.goodStandingCertified) {
      toast.error("You must certify good standing to continue.");
      return;
    }
    save.mutate({
      fullName: form.fullName,
      firmName: form.firmName,
      phone: form.phone || undefined,
      bio: form.bio || undefined,
      barNumber: form.barNumber,
      barState: form.barState,
      yearAdmitted: Number(form.yearAdmitted),
      jurisdictions,
      goodStandingCertified: form.goodStandingCertified,
    });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-navy)] text-white">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <div>
          <h2 className="font-display text-2xl font-extrabold">Verify your credentials</h2>
          <p className="text-sm text-muted-foreground">
            We confirm every attorney is licensed and in good standing before they can bid on cases.
          </p>
        </div>
      </div>

      <Card className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="fullName">Full legal name *</Label>
            <Input id="fullName" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} className="mt-1.5" placeholder="Jane Q. Attorney, Esq." />
          </div>
          <div>
            <Label htmlFor="firmName">Firm / practice name *</Label>
            <Input id="firmName" value={form.firmName} onChange={(e) => set("firmName", e.target.value)} className="mt-1.5" placeholder="Attorney & Associates" />
          </div>
          <div>
            <Label htmlFor="phone">Office phone</Label>
            <Input id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} className="mt-1.5" placeholder="(615) 555-0100" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-secondary/40 p-4">
          <h3 className="flex items-center gap-2 font-display text-sm font-bold">
            <BadgeCheck className="h-4 w-4 text-primary" /> Bar credentials
          </h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="barNumber">Bar number *</Label>
              <Input id="barNumber" value={form.barNumber} onChange={(e) => set("barNumber", e.target.value)} className="mt-1.5" placeholder="012345" />
            </div>
            <div>
              <Label>Admission state *</Label>
              <Select value={form.barState} onValueChange={(v) => set("barState", v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="yearAdmitted">Year admitted *</Label>
              <Input id="yearAdmitted" type="number" min={1950} max={currentYear} value={form.yearAdmitted}
                onChange={(e) => set("yearAdmitted", e.target.value)} className="mt-1.5" placeholder="2015" />
            </div>
          </div>
        </div>

        <div>
          <Label>Counties where you are licensed to practice *</Label>
          <p className="mb-2 mt-1 text-xs text-muted-foreground">
            You can only bid on cases in the counties you certify here. Davidson County, TN is our launch market.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {JURISDICTIONS.map((j) => (
              <label key={j} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors ${
                jurisdictions.includes(j) ? "border-primary bg-accent" : "border-border hover:bg-muted"
              }`}>
                <Checkbox checked={jurisdictions.includes(j)} onCheckedChange={() => toggleJur(j)} />
                <span>{j}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="bio">Short bio (shown to clients)</Label>
          <Textarea id="bio" value={form.bio} onChange={(e) => set("bio", e.target.value)} className="mt-1.5"
            placeholder="15 years defending Nashville tenants in landlord-tenant disputes…" rows={3} />
        </div>

        <label className="flex items-start gap-3 rounded-lg border border-border bg-background p-4">
          <Checkbox checked={form.goodStandingCertified} onCheckedChange={(v) => set("goodStandingCertified", Boolean(v))} className="mt-0.5" />
          <span className="text-sm">
            I certify under penalty of perjury that I am an attorney <strong>licensed and in good standing</strong>{" "}
            to practice in the counties selected above, that my bar number is accurate, and that I am authorized
            to represent clients in those courts.
          </span>
        </label>

        <Button onClick={submit} disabled={save.isPending} className="h-12 w-full bg-primary text-base font-bold text-primary-foreground hover:bg-[var(--brand-orange-strong)]">
          {save.isPending ? "Verifying…" : "Verify & enter the portal"}
        </Button>
      </Card>
    </div>
  );
}
