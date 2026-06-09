import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft,
  Briefcase,
  CreditCard,
  FileText,
  Gavel,
  LayoutDashboard,
  Loader2,
  MapPin,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import PortalLayout from "@/components/PortalLayout";
import AttorneyOnboarding from "@/pages/AttorneyOnboarding";
import {
  BidStatusBadge,
  CaseStatusBadge,
  CourtRecordsPanel,
  DocumentsList,
  money,
} from "@/components/CaseParts";
import { PRICING, attorneyPurchaseTotal } from "@shared/appConstants";

const NAV = [
  { label: "Dashboard", href: "/attorney", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Browse Cases", href: "/attorney/cases", icon: <Briefcase className="h-4 w-4" /> },
  { label: "My Bids", href: "/attorney/bids", icon: <Gavel className="h-4 w-4" /> },
  { label: "Billing", href: "/attorney/billing", icon: <CreditCard className="h-4 w-4" /> },
];

function useRequireAuth() {
  const { isAuthenticated, loading } = useAuth();
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [isAuthenticated, loading]);
  return { isAuthenticated, loading };
}

/** Gate: ensure user is authenticated and has an attorney profile. */
function AttorneyGate({ children }: { children: (slotsRemaining: number) => React.ReactNode }) {
  const { loading: authLoading, isAuthenticated } = useRequireAuth();
  const profileQ = trpc.attorney.myProfile.useQuery(undefined, { enabled: isAuthenticated });

  if (authLoading || !isAuthenticated || profileQ.isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!profileQ.data) {
    return <AttorneyOnboarding onDone={() => profileQ.refetch()} />;
  }
  const remaining = profileQ.data.clientSlotsPurchased - profileQ.data.clientSlotsUsed;
  return <>{children(remaining)}</>;
}

/* ------------------------------- Dashboard ------------------------------- */

export function AttorneyDashboard() {
  const [, navigate] = useLocation();
  const profileQ = trpc.attorney.myProfile.useQuery();
  const casesQ = trpc.attorney.availableCases.useQuery(undefined, { enabled: !!profileQ.data });
  const bidsQ = trpc.attorney.myBids.useQuery(undefined, { enabled: !!profileQ.data });

  return (
    <PortalLayout title="Attorney Dashboard" nav={NAV}>
      <AttorneyGate>
        {(remaining) => (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="p-5">
                <div className="flex items-center gap-2 text-muted-foreground"><Wallet className="h-4 w-4" /> Client slots remaining</div>
                <div className="mt-2 font-display text-3xl font-extrabold">{remaining}</div>
                <Button variant="link" className="mt-1 h-auto p-0 text-primary" onClick={() => navigate("/attorney/billing")}>
                  Buy more access
                </Button>
              </Card>
              <Card className="p-5">
                <div className="flex items-center gap-2 text-muted-foreground"><Briefcase className="h-4 w-4" /> Available cases</div>
                <div className="mt-2 font-display text-3xl font-extrabold">{casesQ.data?.length ?? "—"}</div>
                <Button variant="link" className="mt-1 h-auto p-0 text-primary" onClick={() => navigate("/attorney/cases")}>
                  Browse cases
                </Button>
              </Card>
              <Card className="p-5">
                <div className="flex items-center gap-2 text-muted-foreground"><Gavel className="h-4 w-4" /> Active bids</div>
                <div className="mt-2 font-display text-3xl font-extrabold">
                  {bidsQ.data?.filter((b) => ["submitted", "viewed", "accepted"].includes(b.status ?? "")).length ?? "—"}
                </div>
                <Button variant="link" className="mt-1 h-auto p-0 text-primary" onClick={() => navigate("/attorney/bids")}>
                  View my bids
                </Button>
              </Card>
            </div>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">Verified credentials</h2>
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700 capitalize">
                  {profileQ.data?.verificationStatus}
                </span>
              </div>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div><span className="text-muted-foreground">Name:</span> {profileQ.data?.fullName}</div>
                <div><span className="text-muted-foreground">Firm:</span> {profileQ.data?.firmName}</div>
                <div><span className="text-muted-foreground">Bar #:</span> {profileQ.data?.barNumber} ({profileQ.data?.barState})</div>
                <div><span className="text-muted-foreground">Admitted:</span> {profileQ.data?.yearAdmitted}</div>
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground">Counties:</span>{" "}
                  {((profileQ.data?.jurisdictions ?? []) as string[]).join(", ")}
                </div>
              </div>
            </Card>

            {remaining <= 0 && (
              <Card className="border-primary/40 bg-accent p-5">
                <p className="text-sm">
                  You need client access to submit bids. Purchase at least{" "}
                  {PRICING.ATTORNEY_MIN_CLIENTS} client slots ({money(attorneyPurchaseTotal(PRICING.ATTORNEY_MIN_CLIENTS))}) to get started.
                </p>
                <Button className="mt-3 bg-primary font-semibold text-primary-foreground" onClick={() => navigate("/attorney/billing")}>
                  Purchase client access
                </Button>
              </Card>
            )}
          </div>
        )}
      </AttorneyGate>
    </PortalLayout>
  );
}

/* ------------------------------ Browse Cases ----------------------------- */

export function AttorneyCases() {
  const [, navigate] = useLocation();
  const casesQ = trpc.attorney.availableCases.useQuery();

  return (
    <PortalLayout title="Browse Cases" nav={NAV}>
      <AttorneyGate>
        {() => (
          <div className="space-y-4">
            {casesQ.isLoading && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
            {casesQ.data?.length === 0 && (
              <Card className="p-8 text-center text-muted-foreground">No available cases right now. Check back soon.</Card>
            )}
            <div className="grid gap-4">
              {casesQ.data?.map((c) => (
                <Card key={c.id} className="p-5 transition-shadow hover:shadow-md">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-lg font-bold">{c.caseType}</h3>
                        <CaseStatusBadge status={c.status} />
                        {c.myBidStatus && <BidStatusBadge status={c.myBidStatus} />}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {c.county}</span>
                        <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> {c.documentCount} documents</span>
                        <span className="inline-flex items-center gap-1"><Gavel className="h-3.5 w-3.5" /> {c.priorRecordCount} prior records</span>
                      </div>
                      <p className="mt-3 max-w-2xl text-sm text-muted-foreground line-clamp-2">{c.caseSummary}</p>
                    </div>
                    <div className="text-right">
                      {!c.canBid && (
                        <span className="block text-xs font-medium text-amber-600">Not in your counties</span>
                      )}
                      <Button className="mt-2 font-semibold" onClick={() => navigate(`/attorney/case/${c.id}`)}>
                        View & bid
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </AttorneyGate>
    </PortalLayout>
  );
}

/* ------------------------------ Case Detail ------------------------------ */

export function AttorneyCaseDetail() {
  const params = useParams();
  const caseId = Number(params.id);
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const detailQ = trpc.attorney.caseDetail.useQuery({ caseId }, { enabled: Number.isFinite(caseId) });
  const profileQ = trpc.attorney.myProfile.useQuery();

  const [open, setOpen] = useState(false);
  const [firstTwoFee, setFirstTwoFee] = useState("");
  const [thirdFee, setThirdFee] = useState("");
  const [message, setMessage] = useState("");

  const submitBid = trpc.attorney.submitBid.useMutation({
    onSuccess: async () => {
      toast.success("Bid submitted. The client will be notified.");
      setOpen(false);
      await utils.attorney.caseDetail.invalidate({ caseId });
      await utils.attorney.availableCases.invalidate();
      await utils.attorney.myBids.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (detailQ.isLoading) {
    return (
      <PortalLayout title="Case Detail" nav={NAV}>
        <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </PortalLayout>
    );
  }
  if (!detailQ.data) {
    return (
      <PortalLayout title="Case Detail" nav={NAV}>
        <Card className="p-8 text-center text-muted-foreground">Case not found.</Card>
      </PortalLayout>
    );
  }

  const { case: c, documents, courtRecords, myBid, canBid } = detailQ.data;
  const slotsRemaining = profileQ.data ? profileQ.data.clientSlotsPurchased - profileQ.data.clientSlotsUsed : 0;

  return (
    <PortalLayout title="Case Detail" nav={NAV}>
      <Button variant="ghost" className="mb-4" onClick={() => navigate("/attorney/cases")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to cases
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl font-extrabold">{c.caseType}</h2>
              <CaseStatusBadge status={c.status} />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {c.county}</span>
              <span>Landlord: {c.landlordName}</span>
              {c.hearingDate && <span>Court date: {new Date(c.hearingDate).toLocaleDateString()}</span>}
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed">{c.caseSummary}</p>
          </Card>

          <Card className="p-6">
            <h3 className="mb-3 font-display text-base font-bold">Tenant documents</h3>
            <DocumentsList docs={documents} />
          </Card>

          <CourtRecordsPanel records={courtRecords} landlordName={c.landlordName} />
        </div>

        {/* Bid panel */}
        <div className="space-y-4">
          <Card className="sticky top-20 p-6">
            <h3 className="font-display text-lg font-bold">Your flat-fee bid</h3>
            {myBid ? (
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Status</span><BidStatusBadge status={myBid.status} /></div>
                <div className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex justify-between"><span>First two appearances</span><span className="font-semibold">{money(myBid.firstTwoFee)}</span></div>
                  <div className="mt-1 flex justify-between"><span>Third appearance</span><span className="font-semibold">{money(myBid.thirdFee)}</span></div>
                </div>
                {myBid.message && <p className="text-sm text-muted-foreground">"{myBid.message}"</p>}
              </div>
            ) : (
              <>
                <p className="mt-2 text-sm text-muted-foreground">
                  Set a flat fee covering the first two court appearances, plus a separate fee for a third appearance if needed.
                </p>
                {!canBid && (
                  <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                    You're not certified to practice in {c.county}. Update your credentials to bid.
                  </p>
                )}
                {canBid && slotsRemaining <= 0 && (
                  <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                    No client slots remaining.{" "}
                    <button className="font-semibold underline" onClick={() => navigate("/attorney/billing")}>Buy access</button> to bid.
                  </p>
                )}
                <Button
                  className="mt-4 w-full bg-primary font-bold text-primary-foreground hover:bg-[var(--brand-orange-strong)]"
                  disabled={!canBid || slotsRemaining <= 0}
                  onClick={() => setOpen(true)}
                >
                  Place a bid
                </Button>
              </>
            )}
          </Card>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit your flat-fee bid</DialogTitle>
            <DialogDescription>
              The client sees both fees. The first covers appearances 1–2; the second applies only if a third appearance is required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="f2">First two appearances (flat) *</Label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input id="f2" type="number" className="pl-7" value={firstTwoFee} onChange={(e) => setFirstTwoFee(e.target.value)} placeholder="750" />
              </div>
            </div>
            <div>
              <Label htmlFor="f3">Third appearance (flat) *</Label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input id="f3" type="number" className="pl-7" value={thirdFee} onChange={(e) => setThirdFee(e.target.value)} placeholder="350" />
              </div>
            </div>
            <div>
              <Label htmlFor="m">Message to client (optional)</Label>
              <Textarea id="m" value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1.5" rows={3}
                placeholder="I've handled many non-payment cases in Davidson County and can meet before your court date." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              className="bg-primary font-semibold text-primary-foreground"
              disabled={submitBid.isPending}
              onClick={() => {
                const f2 = Number(firstTwoFee);
                const f3 = Number(thirdFee);
                if (!f2 || !f3) { toast.error("Enter both fees."); return; }
                submitBid.mutate({ caseId, firstTwoFee: f2, thirdFee: f3, message: message || undefined });
              }}
            >
              {submitBid.isPending ? "Submitting…" : "Submit bid"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
}

/* -------------------------------- My Bids -------------------------------- */

export function AttorneyBids() {
  const [, navigate] = useLocation();
  const bidsQ = trpc.attorney.myBids.useQuery();
  const utils = trpc.useUtils();
  const withdraw = trpc.attorney.withdrawBid.useMutation({
    onSuccess: async () => { toast.success("Bid withdrawn."); await utils.attorney.myBids.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <PortalLayout title="My Bids" nav={NAV}>
      <AttorneyGate>
        {() => (
          <div className="space-y-4">
            {bidsQ.data?.length === 0 && (
              <Card className="p-8 text-center text-muted-foreground">
                You haven't placed any bids yet.{" "}
                <button className="font-semibold text-primary underline" onClick={() => navigate("/attorney/cases")}>Browse cases</button>
              </Card>
            )}
            {bidsQ.data?.map((b) => (
              <Card key={b.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{b.case?.caseType ?? "Case"}</h3>
                    <BidStatusBadge status={b.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {b.case?.county} · First two: {money(b.firstTwoFee)} · Third: {money(b.thirdFee)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {b.case && (
                    <Button variant="outline" size="sm" onClick={() => navigate(`/attorney/case/${b.caseId}`)}>View case</Button>
                  )}
                  {["submitted", "viewed"].includes(b.status ?? "") && (
                    <Button variant="ghost" size="sm" className="text-red-600" disabled={withdraw.isPending}
                      onClick={() => withdraw.mutate({ bidId: b.id })}>Withdraw</Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </AttorneyGate>
    </PortalLayout>
  );
}

/* -------------------------------- Billing -------------------------------- */

export function AttorneyBilling() {
  const profileQ = trpc.attorney.myProfile.useQuery();
  const [qty, setQty] = useState<number>(PRICING.ATTORNEY_MIN_CLIENTS);
  const start = trpc.payments.startAttorneyPurchase.useMutation({
    onSuccess: (d) => { if (d.url) window.location.href = d.url; },
    onError: (e) => toast.error(e.message),
  });
  const stripeStatus = trpc.payments.status.useQuery();
  const paymentsQ = trpc.payments.myPayments.useQuery();

  const total = attorneyPurchaseTotal(qty);
  const remaining = profileQ.data ? profileQ.data.clientSlotsPurchased - profileQ.data.clientSlotsUsed : 0;

  return (
    <PortalLayout title="Billing" nav={NAV}>
      <AttorneyGate>
        {() => (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h2 className="font-display text-lg font-bold">Purchase client access</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {money(PRICING.ATTORNEY_PER_CLIENT)} per client · {PRICING.ATTORNEY_MIN_CLIENTS}-client minimum.
              </p>
              <div className="mt-5">
                <Label>Number of clients</Label>
                <div className="mt-2 flex items-center gap-3">
                  <Button variant="outline" size="icon" onClick={() => setQty((q) => Math.max(PRICING.ATTORNEY_MIN_CLIENTS, q - 1))}>−</Button>
                  <span className="w-12 text-center font-display text-2xl font-extrabold">{qty}</span>
                  <Button variant="outline" size="icon" onClick={() => setQty((q) => q + 1)}>+</Button>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <span className="text-muted-foreground">Total today</span>
                <span className="font-display text-2xl font-extrabold">{money(total)}</span>
              </div>
              {!stripeStatus.data?.configured && (
                <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  Stripe test mode isn't configured yet. Add your test keys to enable checkout.
                </p>
              )}
              <Button
                className="mt-4 h-12 w-full bg-primary text-base font-bold text-primary-foreground hover:bg-[var(--brand-orange-strong)]"
                disabled={start.isPending || !stripeStatus.data?.configured}
                onClick={() => start.mutate({ quantity: qty, origin: window.location.origin })}
              >
                {start.isPending ? "Redirecting…" : `Pay ${money(total)} with Stripe`}
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                You currently have <strong>{remaining}</strong> client slot{remaining === 1 ? "" : "s"} remaining.
              </p>
            </Card>

            <Card className="p-6">
              <h2 className="font-display text-lg font-bold">Payment history</h2>
              <div className="mt-4 space-y-2">
                {paymentsQ.data?.length === 0 && <p className="text-sm text-muted-foreground">No payments yet.</p>}
                {paymentsQ.data?.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                    <div>
                      <div className="font-medium capitalize">{p.kind.replace(/_/g, " ")}</div>
                      <div className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{money(p.amount)}</div>
                      <div className={`text-xs ${p.status === "paid" ? "text-green-600" : "text-muted-foreground"}`}>{p.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </AttorneyGate>
    </PortalLayout>
  );
}
