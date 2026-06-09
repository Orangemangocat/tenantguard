import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

export default function PaymentSuccess() {
  const [, navigate] = useLocation();
  const [state, setState] = useState<"verifying" | "paid" | "pending" | "error">("verifying");
  const [kind, setKind] = useState<string>("");
  const verify = trpc.payments.verifySession.useMutation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (!sessionId) { setState("error"); return; }
    verify
      .mutateAsync({ sessionId })
      .then((r) => {
        setKind(r.kind);
        setState(r.status === "paid" ? "paid" : "pending");
      })
      .catch(() => setState("error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const destination =
    kind === "attorney_clients" ? "/attorney" : kind === "consultation" ? "/client/consultations" : "/client";

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-6">
      <Card className="w-full max-w-md p-8 text-center">
        {state === "verifying" && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <h1 className="mt-4 font-display text-xl font-bold">Confirming your payment…</h1>
          </>
        )}
        {state === "paid" && (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <h1 className="mt-4 font-display text-2xl font-extrabold">Payment successful</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {kind === "attorney_clients" && "Your client slots are now available. Start bidding on cases."}
              {kind === "client_onboarding" && "You're onboarded. Attorneys can now send you flat-fee offers."}
              {kind === "consultation" && "Your consultation is booked and credited toward your fees."}
            </p>
            <Button className="mt-6 bg-primary font-semibold text-primary-foreground" onClick={() => navigate(destination)}>
              Continue
            </Button>
          </>
        )}
        {state === "pending" && (
          <>
            <Loader2 className="mx-auto h-12 w-12 text-amber-500" />
            <h1 className="mt-4 font-display text-xl font-bold">Payment processing</h1>
            <p className="mt-2 text-sm text-muted-foreground">This can take a moment. Refresh shortly.</p>
            <Button className="mt-6" variant="outline" onClick={() => navigate(destination)}>Go to dashboard</Button>
          </>
        )}
        {state === "error" && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
            <h1 className="mt-4 font-display text-xl font-bold">Couldn't verify payment</h1>
            <p className="mt-2 text-sm text-muted-foreground">If you were charged, contact support and we'll sort it out.</p>
            <Button className="mt-6" variant="outline" onClick={() => navigate("/")}>Back home</Button>
          </>
        )}
      </Card>
    </div>
  );
}
