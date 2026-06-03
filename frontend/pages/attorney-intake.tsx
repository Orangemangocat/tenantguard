import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { Spinner } from "@chakra-ui/react";
import { submitIntake, uploadIntakeDocument, analyzeIntake } from "@/lib/api";

const DOC_TYPES = [
  { value: "lease", label: "Lease Agreement" },
  { value: "eviction_notice", label: "Eviction Notice" },
  { value: "correspondence", label: "Correspondence / Letters" },
  { value: "court_filing", label: "Court Filing" },
  { value: "payment_record", label: "Payment Record" },
  { value: "photo", label: "Photo / Visual Evidence" },
  { value: "other", label: "Other" },
];

interface UploadedFile {
  file: File;
  docType: string;
}

interface NotebookEntry {
  fact?: string;
  source?: string;
  confidence?: string;
  term?: string;
  definition?: string;
  issue?: string;
  date?: string;
  event?: string;
  action?: string;
  [key: string]: string | undefined;
}

interface Notebook {
  summary?: string;
  facts?: NotebookEntry[];
  timeline?: NotebookEntry[];
  key_terms?: NotebookEntry[];
  urgent_deadlines?: NotebookEntry[];
  open_questions?: string[];
  recommended_next_steps?: string[];
}

interface SubmissionResult {
  id: number;
  status: string;
  notebook?: Notebook;
}

export default function AttorneyIntake() {
  const { data: session, status } = useSession({ required: true });
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [result, setResult] = useState<SubmissionResult | null>(null);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    bar_number: "",
    firm_name: "",
    case_description: "",
  });

  const [pendingFiles, setPendingFiles] = useState<UploadedFile[]>([]);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newDocType, setNewDocType] = useState("court_filing");

  if (status === "loading") return <Spinner size="lg" />;

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.full_name || !form.email || !form.case_description) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, role: "attorney" };
      const data = await submitIntake(payload, session!.access_token);
      setSubmissionId(data.id);
      setStep(2);
    } catch {
      setError("Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addFile = () => {
    if (!newFile) return;
    setPendingFiles((prev) => [...prev, { file: newFile, docType: newDocType }]);
    setNewFile(null);
    setNewDocType("court_filing");
  };

  const removeFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      for (const { file, docType } of pendingFiles) {
        await uploadIntakeDocument(submissionId!, docType, file, session!.access_token);
      }
      const analysisResult = await analyzeIntake(submissionId!, session!.access_token);
      setResult(analysisResult);
      setStep(3);
    } catch {
      setError("Upload or analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => router.push("/")} className="text-sm text-blue-600 hover:underline mb-4 inline-block">
            &larr; Back to Home
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Attorney Intake</h1>
          <p className="text-gray-500 mt-1">Submit a case for AI-assisted analysis and structured case notebook generation.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center mb-8 gap-2">
          {["Attorney Information", "Upload Documents", "Case Analysis"].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${step > i + 1 ? "bg-green-500 text-white" : step === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}
              >
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span className={`text-sm hidden sm:inline ${step === i + 1 ? "font-semibold text-gray-900" : "text-gray-400"}`}>
                {label}
              </span>
              {i < 2 && <div className="flex-1 h-px bg-gray-300 w-6" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Attorney Info */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-900">Your Information</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Full Name *</label>
                <input name="full_name" value={form.full_name} onChange={handleFormChange} required className={fieldClass} placeholder="Jane Smith, Esq." />
              </div>
              <div>
                <label className={labelClass}>Email *</label>
                <input name="email" type="email" value={form.email} onChange={handleFormChange} required className={fieldClass} placeholder="jane@lawfirm.com" />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input name="phone" value={form.phone} onChange={handleFormChange} className={fieldClass} placeholder="(615) 555-0100" />
              </div>
              <div>
                <label className={labelClass}>Tennessee Bar Number</label>
                <input name="bar_number" value={form.bar_number} onChange={handleFormChange} className={fieldClass} placeholder="BPR#12345" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Firm / Organization Name</label>
                <input name="firm_name" value={form.firm_name} onChange={handleFormChange} className={fieldClass} placeholder="Smith & Associates PLLC" />
              </div>
            </div>

            <div>
              <label className={labelClass}>Case Description *</label>
              <textarea
                name="case_description"
                value={form.case_description}
                onChange={handleFormChange}
                required
                rows={6}
                className={fieldClass}
                placeholder="Describe the client's situation, the legal issues involved, relevant dates, and what analysis you need..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? "Saving..." : "Continue to Document Upload →"}
            </button>
          </form>
        )}

        {/* Step 2: Document Upload */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-900">Upload Case Documents</h2>
            <p className="text-sm text-gray-500">
              Upload any documents relevant to the case. The AI agents will extract facts, build a timeline,
              and identify key legal issues. More documents yield a richer notebook.
            </p>

            {/* Add file row */}
            <div className="flex flex-col sm:flex-row gap-3 items-end border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
              <div className="flex-1">
                <label className={labelClass}>Document Type</label>
                <select value={newDocType} onChange={(e) => setNewDocType(e.target.value)} className={fieldClass}>
                  {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className={labelClass}>File</label>
                <input
                  type="file"
                  accept=".pdf,.txt,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={(e) => setNewFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <button
                type="button"
                onClick={addFile}
                disabled={!newFile}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition"
              >
                Add
              </button>
            </div>

            {/* Queued files */}
            {pendingFiles.length > 0 && (
              <ul className="space-y-2">
                {pendingFiles.map((item, i) => (
                  <li key={i} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <span>
                      <span className="font-medium text-gray-800">{item.file.name}</span>
                      <span className="text-gray-400 ml-2">— {DOC_TYPES.find(d => d.value === item.docType)?.label}</span>
                    </span>
                    <button type="button" onClick={() => removeFile(i)} className="text-red-400 hover:text-red-600 ml-4">✕</button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? "Uploading & Analyzing..." : "Generate Case Notebook →"}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Results */}
        {step === 3 && result && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xl">✓</div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Case Notebook Generated</h2>
                  <p className="text-sm text-gray-500">Reference ID: #{result.id}</p>
                </div>
              </div>

              {result.status === "error" && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  Analysis encountered an error. Please retry or contact support.
                </div>
              )}

              {result.notebook && (
                <div className="space-y-6 mt-4">
                  {result.notebook.summary && (
                    <section>
                      <h3 className="font-semibold text-gray-800 mb-2">Executive Summary</h3>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{result.notebook.summary}</p>
                    </section>
                  )}

                  {result.notebook.urgent_deadlines && result.notebook.urgent_deadlines.length > 0 && (
                    <section>
                      <h3 className="font-semibold text-red-700 mb-2">Urgent Deadlines</h3>
                      <ul className="space-y-1">
                        {result.notebook.urgent_deadlines.map((d, i) => (
                          <li key={i} className="text-sm bg-red-50 border border-red-100 rounded px-3 py-2">
                            <span className="font-medium">{d.date}</span> — {d.action}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {result.notebook.recommended_next_steps && result.notebook.recommended_next_steps.length > 0 && (
                    <section>
                      <h3 className="font-semibold text-gray-800 mb-2">Recommended Next Steps</h3>
                      <ol className="list-decimal list-inside space-y-1">
                        {result.notebook.recommended_next_steps.map((step, i) => (
                          <li key={i} className="text-sm text-gray-700">{step}</li>
                        ))}
                      </ol>
                    </section>
                  )}

                  {result.notebook.facts && result.notebook.facts.length > 0 && (
                    <section>
                      <h3 className="font-semibold text-gray-800 mb-2">Established Facts</h3>
                      <ul className="space-y-1">
                        {result.notebook.facts.map((f, i) => (
                          <li key={i} className="text-sm flex gap-2">
                            <span className={`mt-0.5 shrink-0 w-2 h-2 rounded-full ${f.confidence === "high" ? "bg-green-500" : f.confidence === "medium" ? "bg-yellow-400" : "bg-gray-300"}`} />
                            <span className="text-gray-700">{f.fact} <span className="text-gray-400">({f.source})</span></span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {result.notebook.timeline && result.notebook.timeline.length > 0 && (
                    <section>
                      <h3 className="font-semibold text-gray-800 mb-2">Case Timeline</h3>
                      <ul className="border-l-2 border-blue-200 pl-4 space-y-3">
                        {result.notebook.timeline.map((t, i) => (
                          <li key={i} className="text-sm">
                            <span className="font-medium text-blue-700">{t.date}</span>
                            <span className="block text-gray-700">{t.event}</span>
                            {t.significance && <span className="text-gray-400 text-xs">{t.significance}</span>}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {result.notebook.key_terms && result.notebook.key_terms.length > 0 && (
                    <section>
                      <h3 className="font-semibold text-gray-800 mb-2">Key Legal Terms</h3>
                      <dl className="space-y-2">
                        {result.notebook.key_terms.map((t, i) => (
                          <div key={i}>
                            <dt className="text-sm font-medium text-gray-900">{t.term}</dt>
                            <dd className="text-sm text-gray-600 ml-3">{t.definition}</dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  )}

                  {result.notebook.open_questions && result.notebook.open_questions.length > 0 && (
                    <section>
                      <h3 className="font-semibold text-gray-800 mb-2">Open Questions</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {result.notebook.open_questions.map((q, i) => (
                          <li key={i} className="text-sm text-gray-700">{q}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => router.push("/")}
              className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Return to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
