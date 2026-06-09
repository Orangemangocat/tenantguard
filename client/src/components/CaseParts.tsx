import { AlertTriangle, FileText, Gavel, Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const money = (n: number) => `$${n.toLocaleString("en-US")}`;

export function BidStatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const map: Record<string, { label: string; cls: string }> = {
    submitted: { label: "Submitted", cls: "bg-blue-100 text-blue-700" },
    viewed: { label: "Viewed", cls: "bg-amber-100 text-amber-700" },
    accepted: { label: "Accepted", cls: "bg-green-100 text-green-700" },
    declined: { label: "Declined", cls: "bg-red-100 text-red-700" },
    withdrawn: { label: "Withdrawn", cls: "bg-gray-100 text-gray-600" },
  };
  const v = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-600" };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${v.cls}`}>{v.label}</span>;
}

export function CaseStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    available: "bg-green-100 text-green-700",
    bidding: "bg-amber-100 text-amber-700",
    represented: "bg-blue-100 text-blue-700",
    closed: "bg-gray-100 text-gray-600",
  };
  return (
    <Badge className={`${map[status] ?? "bg-gray-100 text-gray-600"} border-none capitalize`}>
      {status}
    </Badge>
  );
}

type Doc = { id: number; title: string; docType?: string | null; description?: string | null };

export function DocumentsList({ docs }: { docs: Doc[] }) {
  if (docs.length === 0) {
    return <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>;
  }
  return (
    <ul className="space-y-2">
      {docs.map((d) => (
        <li key={d.id} className="flex items-start gap-3 rounded-lg border border-border bg-background p-3">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium">{d.title}</span>
              {d.docType && <Badge variant="outline" className="text-[10px] uppercase">{d.docType}</Badge>}
            </div>
            {d.description && <p className="mt-0.5 text-sm text-muted-foreground">{d.description}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

type CourtRec = {
  id: number;
  caseNumber: string;
  court: string;
  filingDate: Date | string | null;
  actionType?: string | null;
  partyPlaintiff?: string | null;
  partyDefendant?: string | null;
  disposition?: string | null;
  outcome?: string | null;
  source?: string;
};

/** A record is "same landlord" if its plaintiff matches the case landlord name. */
function isSameLandlord(plaintiff?: string | null, landlordName?: string | null) {
  if (!plaintiff || !landlordName) return false;
  return plaintiff.trim().toLowerCase().includes(landlordName.trim().toLowerCase()) ||
    landlordName.trim().toLowerCase().includes(plaintiff.trim().toLowerCase());
}

export function CourtRecordsPanel({
  records,
  landlordName,
}: {
  records: CourtRec[];
  landlordName?: string | null;
}) {
  const sameLandlordCount = records.filter((r) => isSameLandlord(r.partyPlaintiff, landlordName)).length;
  return (
    <Card className="border-border p-5">
      <div className="flex items-center gap-2">
        <Landmark className="h-5 w-5 text-[var(--brand-navy)]" />
        <h3 className="font-display text-base font-bold">CaseLink Court History</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Prior court actions located for this tenant and landlord via CaseLink public records.
      </p>

      {sameLandlordCount > 0 && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm">
            <strong>{sameLandlordCount} prior filing{sameLandlordCount > 1 ? "s" : ""}</strong> by the
            same landlord{landlordName ? ` (${landlordName})` : ""} against this tenant — potentially
            relevant to a pattern or retaliation defense.
          </p>
        </div>
      )}

      {records.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No prior court records found.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {records.map((r) => {
            const same = isSameLandlord(r.partyPlaintiff, landlordName);
            return (
            <div key={r.id} className="rounded-lg border border-border bg-background p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-medium">
                  <Gavel className="h-4 w-4 text-muted-foreground" />
                  {r.caseNumber}
                </span>
                {same && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                    Same landlord
                  </span>
                )}
              </div>
              <div className="mt-2 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                <span><span className="text-foreground">Court:</span> {r.court}</span>
                <span><span className="text-foreground">Filed:</span> {r.filingDate ? new Date(r.filingDate).toLocaleDateString() : "—"}</span>
                <span><span className="text-foreground">Type:</span> {r.actionType ?? "—"}</span>
                <span><span className="text-foreground">Outcome:</span> {r.outcome ?? r.disposition ?? "Pending"}</span>
                <span className="sm:col-span-2"><span className="text-foreground">Parties:</span> {r.partyPlaintiff ?? "—"} v. {r.partyDefendant ?? "—"}</span>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
