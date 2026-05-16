"use client";

import { useEffect, useState } from "react";
import { BubbleCard } from "@/components/ui/BubbleCard";
import { BubbleButton } from "@/components/ui/BubbleButton";
import { 
  ClipboardList, Search, Eye, Loader2, CheckCircle2, 
  Clock, AlertCircle, X, Filter
} from "lucide-react";
import { consultantApi, Assignment, CaseItem } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

export default function SubmissionsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selection state for viewing specific submission
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);
  const [reviewState, setReviewState] = useState<Record<string, { ok: boolean; comment: string }>>({});
  const [reviewSummary, setReviewSummary] = useState("");
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [newCaseTitle, setNewCaseTitle] = useState("");
  const [assignmentFiles, setAssignmentFiles] = useState<Record<string, { name?: string; url: string }>>({});
  const [compareFieldId, setCompareFieldId] = useState<string | null>(null);
  const [compareVersionIndex, setCompareVersionIndex] = useState<string>("");

  const fetchAssignments = () => {
    setLoading(true);
    consultantApi.getAssignments()
      .then(setAssignments)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const load = async () => {
      fetchAssignments();
    };
    void load();
  }, []);

  const filtered = assignments.filter(a => {
    const matchesSearch = 
      a.client?.username.toLowerCase().includes(search.toLowerCase()) ||
      a.template?.title.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Form Submissions</h1>
          <p className="text-foreground/60">Review and manage client form responses in real-time.</p>
        </div>
        <BubbleButton onClick={fetchAssignments} variant="secondary" className="gap-2 shrink-0">
          <Loader2 size={16} className={loading ? "animate-spin" : ""} /> Refresh Data
        </BubbleButton>
      </div>

      <BubbleCard className="p-6">
        {/* Filters Header */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
            <input
              type="text"
              placeholder="Filter by client or form title..."
              className="w-full h-11 pl-10 pr-4 rounded-bubble-sm border-[3px] border-border bg-background focus:outline-none focus:border-lava-500 transition-colors font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
             <Filter size={16} className="text-foreground/40" />
             <select 
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value)}
               className="h-11 px-4 rounded-bubble-sm border-[3px] border-border bg-background focus:outline-none focus:border-lava-500 transition-colors font-bold text-sm cursor-pointer min-w-[140px]"
             >
               <option value="all">All Statuses</option>
               <option value="not_started">Pending</option>
               <option value="submitted">Submitted</option>
               <option value="reviewed">Reviewed</option>
             </select>
          </div>
        </div>

        {loading && !assignments.length ? (
          <div className="flex items-center justify-center py-24 gap-3 text-foreground/50">
            <Loader2 className="animate-spin" /> Loading responses…
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500 font-bold">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-[3px] border-border/80">
                  <th className="pb-4 font-black uppercase text-[10px] tracking-widest text-foreground/40">Client</th>
                  <th className="pb-4 font-black uppercase text-[10px] tracking-widest text-foreground/40">Form Template</th>
                  <th className="pb-4 font-black uppercase text-[10px] tracking-widest text-foreground/40">Status</th>
                  <th className="pb-4 font-black uppercase text-[10px] tracking-widest text-foreground/40">Last Action</th>
                  <th className="pb-4 font-black uppercase text-[10px] tracking-widest text-foreground/40 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y-[2px] divide-border/30">
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center text-foreground/30 font-bold italic">No submissions match your filter</td></tr>
                ) : filtered.map((a, i) => (
                  <motion.tr 
                    key={a.id} 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: i * 0.03 }}
                    className="group hover:bg-background/40 transition-colors"
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-bubble-sm bg-lava-500/10 border-[3px] border-lava-500/20 text-lava-600 flex items-center justify-center font-black text-xs">
                          {a.client?.username?.[0]?.toUpperCase()}
                        </div>
                        <span className="font-bold text-base">{a.client?.username}</span>
                      </div>
                    </td>
                    <td className="py-4 font-medium text-foreground/70">{a.template?.title}</td>
                    <td className="py-4">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="py-4 text-xs font-bold text-foreground/40">
                      {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : "Never"}
                    </td>
                    <td className="py-4 text-right">
                       <BubbleButton 
                        onClick={() => {
                          setViewingAssignment(a);
                          setReviewState((a.field_reviews as Record<string, { ok: boolean; comment: string }>) || {});
                          setReviewSummary(a.review_summary || "");
                          setSelectedCaseId(a.case_id ? String(a.case_id) : "");
                          setNewCaseTitle("");
                          consultantApi.getCases(a.client_id).then(setCases).catch(() => setCases([]));
                          consultantApi.getAssignmentFiles(a.id).then((payload) => {
                            const byField: Record<string, { name?: string; url: string }> = {};
                            payload.files.forEach((f) => { byField[f.field_id] = { name: f.name, url: f.url }; });
                            setAssignmentFiles(byField);
                          }).catch(() => setAssignmentFiles({}));
                        }}
                        disabled={a.status === "not_started"}
                        variant="ghost" 
                        size="sm" 
                        className="gap-2 border-border hover:border-lava-500 hover:text-lava-500"
                      >
                         <Eye size={14} /> View Response
                       </BubbleButton>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </BubbleCard>

      {/* Response Viewer Modal */}
      <AnimatePresence>
        {viewingAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl max-h-[90vh] flex flex-col"
            >
              <BubbleCard className="flex-1 flex flex-col p-0 shadow-2xl relative overflow-hidden">
                <div className="p-6 border-b-[3px] border-border flex items-center justify-between bg-surface">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-bubble-sm bg-lava-500 border-[3px] border-lava-600 shadow-md flex items-center justify-center text-white">
                      <ClipboardList size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black tracking-tight">{viewingAssignment.template?.title}</h3>
                      <p className="text-xs font-bold text-foreground/50 uppercase">Submitted by <span className="text-lava-500">{viewingAssignment.client?.username}</span></p>
                    </div>
                  </div>
                  <button onClick={() => setViewingAssignment(null)} className="p-2 hover:bg-background rounded-full transition-all">
                    <X size={20} className="text-foreground/40" />
                  </button>
                </div>
                <div className="px-6 py-4 border-b-[2px] border-border/70 bg-background/60 flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={selectedCaseId}
                      onChange={(e) => setSelectedCaseId(e.target.value)}
                      className="h-10 px-3 rounded-bubble-sm border-[2px] border-border bg-background text-sm font-semibold min-w-[240px]"
                    >
                      <option value="">No case linked</option>
                      {cases.map((caseItem) => (
                        <option key={caseItem.id} value={String(caseItem.id)}>{caseItem.title}</option>
                      ))}
                    </select>
                    <BubbleButton
                      variant="secondary"
                      onClick={async () => {
                        if (!viewingAssignment) return;
                        await consultantApi.assignAssignmentCase(viewingAssignment.id, { case_id: selectedCaseId ? Number(selectedCaseId) : null });
                        fetchAssignments();
                      }}
                    >
                      Save Case Link
                    </BubbleButton>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      value={newCaseTitle}
                      onChange={(e) => setNewCaseTitle(e.target.value)}
                      placeholder="Create new case for this client"
                      className="h-10 px-3 rounded-bubble-sm border-[2px] border-border bg-background text-sm min-w-[280px]"
                    />
                    <BubbleButton
                      variant="secondary"
                      onClick={async () => {
                        if (!viewingAssignment || !newCaseTitle.trim()) return;
                        const updated = await consultantApi.assignAssignmentCase(viewingAssignment.id, { new_case_title: newCaseTitle.trim() });
                        setSelectedCaseId(updated.case_id ? String(updated.case_id) : "");
                        const refreshed = await consultantApi.getCases(viewingAssignment.client_id);
                        setCases(refreshed);
                        setNewCaseTitle("");
                        fetchAssignments();
                      }}
                    >
                      Create And Link
                    </BubbleButton>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 custom-scrollbar bg-background/20">
                  {viewingAssignment.form_data ? (
                     Object.entries(viewingAssignment.form_data).map(([fieldId, value]) => {
                        // Find matching label from schema if possible
                        const schemaFields = ((viewingAssignment.template?.schema_data as { fields?: Array<{ id: string; label?: string }> } | undefined)?.fields) || [];
                        const fieldMeta = schemaFields.find((f) => f.id === fieldId);
                        const label = fieldMeta?.label || fieldId;
                        
                        const review = reviewState[fieldId] || { ok: true, comment: "" };
                        return (
                          <div key={fieldId} className="flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">{label}</span>
                            <div className="p-4 rounded-bubble-sm bg-surface border-[2px] border-border font-bold text-foreground/80 leading-relaxed shadow-sm">
                              {renderValue(value, assignmentFiles[fieldId]?.url)}
                            </div>
                            {isFileValue(value) && Array.isArray((value as { versions?: unknown[] }).versions) && ((value as { versions: unknown[] }).versions.length > 0) && (
                              <div className="rounded-bubble-sm border-[2px] border-border bg-background p-3">
                                <div className="flex items-center gap-2">
                                  <button className="text-xs font-black text-blue-600 underline" onClick={() => { setCompareFieldId(fieldId); setCompareVersionIndex(""); }}>
                                    Compare Versions
                                  </button>
                                  <span className="text-xs text-foreground/50">Latest shown by default</span>
                                </div>
                                {compareFieldId === fieldId && (
                                  <div className="mt-2 space-y-2">
                                    <select
                                      value={compareVersionIndex}
                                      onChange={(e) => setCompareVersionIndex(e.target.value)}
                                      className="h-9 px-2 rounded-bubble-sm border-[2px] border-border bg-background text-xs"
                                    >
                                      <option value="">Pick old version</option>
                                      {(value as { versions: Array<{ name?: string }> }).versions.map((v, idx) => (
                                        <option key={idx} value={String(idx)}>{v.name || `Version ${idx + 1}`}</option>
                                      ))}
                                    </select>
                                    {compareVersionIndex !== "" && (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <a className="text-xs text-blue-600 underline" href={assignmentFiles[fieldId]?.url} target="_blank" rel="noreferrer">Open latest side</a>
                                        <a
                                          className="text-xs text-blue-600 underline"
                                          href={`/static/uploads/${(((value as { versions: Array<{ file_path?: string }> }).versions[Number(compareVersionIndex)] || {}).file_path || "")}`}
                                          target="_blank"
                                          rel="noreferrer"
                                        >
                                          Open selected old version
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="flex flex-col gap-2 mt-1">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setReviewState((prev) => ({ ...prev, [fieldId]: { ...review, ok: true } }))}
                                  className={`cursor-pointer px-3 py-1.5 rounded-bubble-sm border-[2px] text-xs font-black uppercase tracking-tight transition-all ${
                                    review.ok
                                      ? "bg-green-500/15 text-green-600 border-green-500/40"
                                      : "bg-background text-foreground/40 border-border hover:border-green-500/30"
                                  }`}
                                >
                                  ✓ Approved
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setReviewState((prev) => ({ ...prev, [fieldId]: { ...review, ok: false } }))}
                                  className={`cursor-pointer px-3 py-1.5 rounded-bubble-sm border-[2px] text-xs font-black uppercase tracking-tight transition-all ${
                                    !review.ok
                                      ? "bg-red-500/15 text-red-600 border-red-500/40"
                                      : "bg-background text-foreground/40 border-border hover:border-red-500/30"
                                  }`}
                                >
                                  ✕ Rejected
                                </button>
                              </div>
                              {!review.ok && (
                                <input
                                  value={review.comment}
                                  onChange={(e) => setReviewState((prev) => ({ ...prev, [fieldId]: { ...review, comment: e.target.value } }))}
                                  placeholder="Comment for client — explain what to fix..."
                                  className="w-full h-9 px-3 rounded-bubble-sm border-[2px] border-red-500/30 bg-red-500/5 text-sm"
                                />
                              )}
                            </div>
                          </div>
                        );
                     })
                  ) : (
                    <div className="py-20 text-center flex flex-col items-center gap-4">
                       <AlertCircle size={48} className="text-foreground/10" />
                       <p className="font-bold text-foreground/40">This user has not submitted their data yet.</p>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t-[3px] border-border bg-surface flex justify-end gap-3">
                   <BubbleButton variant="secondary" onClick={() => setViewingAssignment(null)}>Close Viewer</BubbleButton>
                   <input
                     value={reviewSummary}
                     onChange={(e) => setReviewSummary(e.target.value)}
                     placeholder="Overall review summary"
                     className="h-10 px-3 rounded-bubble-sm border-[2px] border-border bg-background text-sm w-64"
                   />
                   <BubbleButton
                     className="bg-red-500 border-red-600"
                     onClick={async () => {
                       if (!viewingAssignment) return;
                       await consultantApi.reviewAssignment(viewingAssignment.id, {
                         field_reviews: reviewState,
                         review_summary: reviewSummary,
                         requires_changes: true,
                       });
                       setViewingAssignment(null);
                       fetchAssignments();
                     }}
                   >
                     Request Changes
                   </BubbleButton>
                   <BubbleButton
                     className="bg-green-500 border-green-600"
                     onClick={async () => {
                       if (!viewingAssignment) return;
                       await consultantApi.reviewAssignment(viewingAssignment.id, {
                         field_reviews: reviewState,
                         review_summary: reviewSummary,
                         requires_changes: false,
                       });
                       setViewingAssignment(null);
                       fetchAssignments();
                     }}
                   >
                     Approve
                   </BubbleButton>
                </div>
              </BubbleCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
      `}</style>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { color: string; icon: JSX.Element; label: string }> = {
    submitted: { color: "bg-green-500/10 text-green-600 border-green-500/30", icon: <CheckCircle2 size={12} />, label: "SUBMITTED" },
    not_started: { color: "bg-red-500/10 text-red-600 border-red-500/30", icon: <Clock size={12} />, label: "PENDING" },
    reviewed: { color: "bg-purple-500/10 text-purple-600 border-purple-500/30", icon: <CheckCircle2 size={12} />, label: "REVIEWED" },
    in_progress: { color: "bg-blue-500/10 text-blue-600 border-blue-500/30", icon: <Clock size={12} />, label: "IN PROGRESS" },
  };

  const config = configs[status] || configs.not_started;

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-bubble-sm border-[2px] w-fit text-[10px] font-black tracking-tight ${config.color}`}>
       {config.icon} {config.label}
    </div>
  );
}

function isFileValue(val: unknown): val is { url?: string; name?: string; file_path?: string; versions?: unknown[] } {
  return typeof val === "object" && val !== null && ("url" in val || "file_path" in val || "name" in val);
}

function renderValue(val: unknown, fallbackUrl?: string) {
  if (Array.isArray(val)) return val.join(", ");
  if (typeof val === "object" && val !== null) {
      if (val.url || fallbackUrl) return <a href={val.url || fallbackUrl} target="_blank" className="text-blue-500 underline" rel="noreferrer">{val.name || "View file"}</a>;
      if (val.name) return val.name;
      return JSON.stringify(val);
  }
  return String(val);
}
