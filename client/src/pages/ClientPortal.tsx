import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  FileText,
  Gavel,
  LayoutDashboard,
  Loader2,
  MessageSquare,
  Send,
  ShieldCheck,
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
import {
  BidStatusBadge,
  CaseStatusBadge,
  CourtRecordsPanel,
  DocumentsList,
  money,
} from "@/components/CaseParts";
import { PRICING } from "@shared/appConstants";

const NAV = [
  { label: "My Case", href: "/client", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Attorney Bids", href: "/client/bids", icon: <Gavel className="h-4 w-4" /> },
  { label: "Consultations", href: "/client/consultations", icon: <CalendarClock className="h-4 w-4" /> },
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

/* ------------------------------ Dashboard -------------------------------- */

export function ClientDashboard() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useRequireAuth();
  const casesQ = trpc.clientPortal.myCases.useQuery(undefined, { enabled: isAuthenticated });

  if (loading || !isAuthenticated || casesQ.isLoading) {
    return (
      <PortalLayout title="My Case" nav={NAV}>
        <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </PortalLayout>
    );
  }

  const cases = casesQ.data ?? [];

  if (cases.length === 0) {
    return (
      <PortalLayout title="My Case" nav={NAV}>
        <Card className="mx-auto max-w-xl p-8 text-center">
          <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-primary" />
          <h2 className="font-display text-xl font-bold">Let's start your case</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Tell us about your situation so vetted local attorneys can review it and send you flat-fee offers.
          </p>
          <Button className="mt-5 bg-primary font-semibold text-primary-foreground" onClick={() => navigate("/get-started")}>
            Start my intake
          </Button>
        </Card>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title="My Case" nav={NAV}>
      <div className="space-y-4">
        {cases.map((c) => (
          <Card key={c.id} className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-xl font-extrabold">{c.caseType}</h2>
                  <CaseStatusBadge status={c.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{c.county}, {c.state} · Landlord: {c.landlordName ?? "—"}</p>
                <p className="mt-3 max-w-2xl text-sm line-clamp-2">{c.caseSummary}</p>
              </div>
              <Button className="font-semibold" onClick={() => navigate(`/client/case/${c.id}`)}>
                View bids & details
              </Button>
            </div>
            {!c.onboardingPaid && (
              <div className="mt-4 rounded-lg bg-accent p-3 text-sm">
                Complete your {money(PRICING.CLIENT_ONBOARDING)} onboarding to unlock attorney matching.{" "}
                <button className="font-semibold text-primary underline" onClick={() => navigate(`/client/case/${c.id}`)}>Pay now</button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </PortalLayout>
  );
}

/* ----------------------------- Case Detail ------------------------------- */

export function ClientCaseDetail() {
  const params = useParams();
  const caseId = Number(params.id);
  const [, navigate] = useLocation();
  const { isAuthenticated } = useRequireAuth();
  const utils = trpc.useUtils();
  const detailQ = trpc.clientPortal.caseDetail.useQuery({ caseId }, { enabled: isAuthenticated && Number.isFinite(caseId) });
  const stripeStatus = trpc.payments.status.useQuery();

  const [msgBidId, setMsgBidId] = useState<number | null>(null);
  const [scheduleBidId, setScheduleBidId] = useState<number | null>(null);

  const payOnboarding = trpc.payments.startClientOnboarding.useMutation({
    onSuccess: (d) => { if (d.url) window.location.href = d.url; },
    onError: (e) => toast.error(e.message),
  });
  const acceptBid = trpc.clientPortal.acceptBid.useMutation({
    onSuccess: async () => { toast.success("Bid accepted. Your attorney will be in touch."); await utils.clientPortal.caseDetail.invalidate({ caseId }); },
    onError: (e) => toast.error(e.message),
  });
  const declineBid = trpc.clientPortal.declineBid.useMutation({
    onSuccess: async () => { toast.success("Bid declined."); await utils.clientPortal.caseDetail.invalidate({ caseId }); },
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

  const { case: c, documents, courtRecords, bids } = detailQ.data;

  return (
    <PortalLayout title="Case Detail" nav={NAV}>
      <Button variant="ghost" className="mb-4" onClick={() => navigate("/client")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to my case
      </Button>

      {!c.onboardingPaid && (
        <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 border-primary/40 bg-accent p-5">
          <div>
            <h3 className="font-display text-base font-bold">Complete onboarding to get matched</h3>
            <p className="text-sm text-muted-foreground">One-time {money(PRICING.CLIENT_ONBOARDING)} fee. Attorneys can then send flat-fee offers.</p>
          </div>
          <Button
            className="bg-primary font-bold text-primary-foreground hover:bg-[var(--brand-orange-strong)]"
            disabled={payOnboarding.isPending || !stripeStatus.data?.configured}
            onClick={() => payOnboarding.mutate({ caseId, origin: window.location.origin })}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            {payOnboarding.isPending ? "Redirecting…" : `Pay ${money(PRICING.CLIENT_ONBOARDING)}`}
          </Button>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Bids */}
          <div>
            <h2 className="mb-3 font-display text-lg font-bold">Attorney offers ({bids.length})</h2>
            {bids.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                No offers yet. Once your onboarding is complete, vetted attorneys will send flat-fee bids here.
              </Card>
            ) : (
              <div className="space-y-4">
                {bids.map((b) => (
                  <Card key={b.id} className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-base font-bold">{b.attorney?.firmName ?? "Attorney"}</h3>
                          {b.attorney?.verificationStatus === "verified" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                              <ShieldCheck className="h-3 w-3" /> Verified
                            </span>
                          )}
                          <BidStatusBadge status={b.status} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {b.attorney?.fullName} · Admitted {b.attorney?.yearAdmitted} ({b.attorney?.barState})
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-lg border border-border p-3">
                        <div className="text-xs text-muted-foreground">First two appearances</div>
                        <div className="font-display text-xl font-extrabold">{money(b.firstTwoFee)}</div>
                      </div>
                      <div className="rounded-lg border border-border p-3">
                        <div className="text-xs text-muted-foreground">Third appearance (if needed)</div>
                        <div className="font-display text-xl font-extrabold">{money(b.thirdFee)}</div>
                      </div>
                    </div>

                    {b.message && <p className="mt-3 rounded-lg bg-secondary/50 p-3 text-sm">"{b.message}"</p>}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {b.status === "accepted" ? (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-700">
                          <CheckCircle2 className="h-4 w-4" /> You accepted this offer
                        </span>
                      ) : (
                        <>
                          <Button size="sm" className="bg-primary font-semibold text-primary-foreground"
                            disabled={acceptBid.isPending || c.status === "represented"}
                            onClick={() => acceptBid.mutate({ bidId: b.id })}>
                            Accept offer
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setMsgBidId(b.id)}>
                            <MessageSquare className="mr-1.5 h-4 w-4" /> Ask a question
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setScheduleBidId(b.id)}>
                            <CalendarClock className="mr-1.5 h-4 w-4" /> Book 30-min call · {money(PRICING.CONSULTATION_FEE)}
                          </Button>
                          {b.status !== "declined" && (
                            <Button size="sm" variant="ghost" className="text-red-600"
                              disabled={declineBid.isPending}
                              onClick={() => declineBid.mutate({ bidId: b.id })}>
                              Decline
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Card className="p-6">
            <h3 className="mb-3 font-display text-base font-bold">Your documents</h3>
            <DocumentsList docs={documents} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="font-display text-base font-bold">{c.caseType}</h3>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <div>{c.county}, {c.state}</div>
              <div>Landlord: {c.landlordName ?? "—"}</div>
              {c.hearingDate && <div>Court date: {new Date(c.hearingDate).toLocaleDateString()}</div>}
            </div>
            <p className="mt-3 whitespace-pre-line text-sm">{c.caseSummary}</p>
          </Card>
          <CourtRecordsPanel records={courtRecords} landlordName={c.landlordName} />
        </div>
      </div>

      {msgBidId !== null && (
        <MessageDialog bidId={msgBidId} onClose={() => setMsgBidId(null)} />
      )}
      {scheduleBidId !== null && (
        <ScheduleDialog bidId={scheduleBidId} stripeReady={!!stripeStatus.data?.configured} onClose={() => setScheduleBidId(null)} />
      )}
    </PortalLayout>
  );
}

/* --------------------------- Message Dialog ------------------------------ */

function MessageDialog({ bidId, onClose }: { bidId: number; onClose: () => void }) {
  const utils = trpc.useUtils();
  const msgsQ = trpc.clientPortal.messages.useQuery({ bidId });
  const [body, setBody] = useState("");
  const send = trpc.clientPortal.sendMessage.useMutation({
    onSuccess: async () => { setBody(""); await utils.clientPortal.messages.invalidate({ bidId }); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Follow-up questions</DialogTitle>
          <DialogDescription>Ask the attorney anything before you decide. They'll reply here.</DialogDescription>
        </DialogHeader>
        <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
          {msgsQ.data?.length === 0 && <p className="text-sm text-muted-foreground">No messages yet. Start the conversation.</p>}
          {msgsQ.data?.map((m) => (
            <div key={m.id} className={`flex ${m.senderRole === "client" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.senderRole === "client" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                {m.body}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type your question…"
            onKeyDown={(e) => { if (e.key === "Enter" && body.trim()) send.mutate({ bidId, body }); }} />
          <Button className="bg-primary text-primary-foreground" disabled={!body.trim() || send.isPending}
            onClick={() => send.mutate({ bidId, body })}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------- Schedule Dialog ----------------------------- */

function ScheduleDialog({ bidId, stripeReady, onClose }: { bidId: number; stripeReady: boolean; onClose: () => void }) {
  const [dt, setDt] = useState("");
  const request = trpc.clientPortal.requestConsultation.useMutation({
    onError: (e) => toast.error(e.message),
  });
  const pay = trpc.payments.startConsultationPayment.useMutation({
    onSuccess: (d) => { if (d.url) window.location.href = d.url; },
    onError: (e) => toast.error(e.message),
  });

  const minDt = useMemo(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    d.setMinutes(0, 0, 0);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }, []);

  const handleSchedule = async () => {
    if (!dt) { toast.error("Pick a date and time."); return; }
    const consult = await request.mutateAsync({ bidId, scheduledAt: new Date(dt).getTime() });
    if (!consult?.id) { toast.error("Could not create consultation."); return; }
    await pay.mutateAsync({ consultationId: consult.id, origin: window.location.origin });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book a 30-minute consultation</DialogTitle>
          <DialogDescription>
            {money(PRICING.CONSULTATION_FEE)} — fully credited toward your attorney's fees if you proceed.
          </DialogDescription>
        </DialogHeader>
        <div>
          <Label htmlFor="dt">Preferred date & time</Label>
          <Input id="dt" type="datetime-local" className="mt-1.5" min={minDt} value={dt} onChange={(e) => setDt(e.target.value)} />
        </div>
        {!stripeReady && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Stripe test mode isn't configured yet.</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-primary font-semibold text-primary-foreground"
            disabled={!stripeReady || request.isPending || pay.isPending}
            onClick={handleSchedule}>
            {request.isPending || pay.isPending ? "Processing…" : `Pay ${money(PRICING.CONSULTATION_FEE)} & book`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------- Consultations ----------------------------- */

export function ClientConsultations() {
  const { isAuthenticated } = useRequireAuth();
  const consultsQ = trpc.clientPortal.myConsultations.useQuery(undefined, { enabled: isAuthenticated });

  return (
    <PortalLayout title="Consultations" nav={NAV}>
      <div className="space-y-4">
        {consultsQ.data?.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">No consultations booked yet.</Card>
        )}
        {consultsQ.data?.map((c) => (
          <Card key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <div className="font-semibold">{new Date(c.scheduledAt).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">{c.durationMinutes} min · {money(c.feeAmount)} (credited to fees)</div>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
              c.status === "scheduled" ? "bg-green-100 text-green-700" :
              c.status === "pending_payment" ? "bg-amber-100 text-amber-700" :
              "bg-secondary text-muted-foreground"
            }`}>
              {c.status.replace(/_/g, " ")}
            </span>
          </Card>
        ))}
      </div>
    </PortalLayout>
  );
}

/* ------------------------------- My Bids --------------------------------- */

export function ClientBids() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useRequireAuth();
  const casesQ = trpc.clientPortal.myCases.useQuery(undefined, { enabled: isAuthenticated });
  const firstCaseId = casesQ.data?.[0]?.id;

  useEffect(() => {
    if (firstCaseId) navigate(`/client/case/${firstCaseId}`);
  }, [firstCaseId, navigate]);

  return (
    <PortalLayout title="Attorney Bids" nav={NAV}>
      <div className="flex h-[40vh] items-center justify-center text-muted-foreground">
        {casesQ.isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : "Redirecting to your case…"}
      </div>
    </PortalLayout>
  );
}
