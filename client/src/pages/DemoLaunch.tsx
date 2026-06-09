import { useLocation } from "wouter";
import { Briefcase, Home as HomeIcon, Loader2, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function DemoLaunch() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useAuth();

  const becomeAttorney = trpc.demo.becomeAttorney.useMutation();
  const becomeClient = trpc.demo.becomeClientWithCase.useMutation();
  const seedBids = trpc.demo.seedBidsForMyCase.useMutation();

  const busy = becomeAttorney.isPending || becomeClient.isPending || seedBids.isPending;

  async function launchAttorney() {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    try {
      await becomeAttorney.mutateAsync();
      toast.success("You're set up as a verified demo attorney with client slots.");
      navigate("/attorney/cases");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not set up demo attorney");
    }
  }

  async function launchClient() {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    try {
      const res = await becomeClient.mutateAsync();
      await seedBids.mutateAsync({ caseId: res.caseId });
      toast.success("Your demo tenant case is ready with sample attorney bids.");
      navigate(`/client/case/${res.caseId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not set up demo client");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Test mode
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight md:text-5xl">
            Explore both sides of TenantGuard
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Jump straight into a fully populated portal. We'll provision your account
            instantly — no credential review or Stripe checkout required for this demo.
            {!isAuthenticated && !loading && (
              <span className="mt-2 block text-base font-medium text-foreground">
                You'll be asked to sign in first.
              </span>
            )}
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
          {/* Attorney */}
          <Card className="flex flex-col p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold">Explore as an Attorney</h2>
            <p className="mt-2 flex-1 text-muted-foreground">
              Become a verified Davidson County attorney with purchased client slots.
              Browse six pre-screened tenant cases, review documents and prior court
              records, and submit flat-fee bids.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> 6 ready-to-bid tenant cases</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Credentials auto-verified</li>
            </ul>
            <Button
              className="mt-6 h-12 bg-primary text-base font-bold text-primary-foreground hover:bg-[var(--brand-orange-strong)]"
              disabled={busy}
              onClick={launchAttorney}
            >
              {becomeAttorney.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Launch attorney portal
            </Button>
          </Card>

          {/* Client */}
          <Card className="flex flex-col p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <HomeIcon className="h-6 w-6 text-primary" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold">Explore as a Tenant</h2>
            <p className="mt-2 flex-1 text-muted-foreground">
              Get a demo tenant case complete with documents and prior CaseLink
              records, plus three sample attorney bids. Review bids, ask follow-up
              questions, and schedule a $25 consultation.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> 3 incoming attorney bids</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Prior landlord court history</li>
            </ul>
            <Button
              variant="outline"
              className="mt-6 h-12 bg-background text-base font-bold"
              disabled={busy}
              onClick={launchClient}
            >
              {becomeClient.isPending || seedBids.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Launch tenant portal
            </Button>
          </Card>
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground">
          This page exists for testing. In production, attorneys complete credential
          verification and purchase client access, and tenants complete intake and the
          $250 onboarding payment.
        </p>
      </section>
      <SiteFooter />
    </div>
  );
}
