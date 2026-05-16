"use client";

import { useEffect, useMemo, useState, use } from "react";
import { consultantApi, Assignment, CaseItem, User } from "@/lib/api";
import { BubbleCard } from "@/components/ui/BubbleCard";
import { BubbleButton } from "@/components/ui/BubbleButton";
import { InAppDocViewer } from "@/components/ui/InAppDocViewer";
import { Loader2, ArrowLeft, FolderKanban, FileText, Activity, UserRound, Plus, ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";

type Tab = "overview" | "cases" | "documents" | "activity";

type ClientDoc = {
  assignmentId: number;
  name: string;
  url: string;
  fieldId: string;
  caseId: number | null;
  caseTitle: string;
};

export default function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const clientId = Number(id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [client, setClient] = useState<User | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [newCaseTitle, setNewCaseTitle] = useState("");
  const [files, setFiles] = useState<ClientDoc[]>([]);
  const [viewer, setViewer] = useState<{ url: string; name: string } | null>(null);
  const [selectedCaseFilter, setSelectedCaseFilter] = useState<string>("all");
  const [expandedCaseId, setExpandedCaseId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [clients, allAssignments, caseList] = await Promise.all([
          consultantApi.getClients(),
          consultantApi.getAssignments(),
          consultantApi.getCases(clientId),
        ]);
        const currentClient = clients.find((c) => c.id === clientId) || null;
        setClient(currentClient);
        const clientAssignments = allAssignments.filter((a) => a.client_id === clientId);
        setAssignments(clientAssignments);
        setCases(caseList);

        const payloads = await Promise.all(
          clientAssignments.map(async (a) => {
            try {
              const payload = await consultantApi.getAssignmentFiles(a.id);
              return payload.files.map((f) => ({
                assignmentId: a.id,
                name: f.name || "Document",
                url: f.url,
                fieldId: f.field_id,
                caseId: a.case_id ?? null,
                caseTitle: a.case?.title || "Unassigned",
              }));
            } catch {
              return [] as ClientDoc[];
            }
          })
        );
        setFiles(payloads.flat());
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load client profile");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [clientId]);

  const stats = useMemo(() => {
    const submitted = assignments.filter((a) => a.status === "submitted").length;
    const rejected = assignments.filter((a) => a.requires_changes).length;
    return {
      activeCases: cases.filter((c) => c.status === "open").length,
      totalDocuments: files.length,
      pendingApprovals: submitted,
      rejected,
      recentActivity: assignments
        .slice()
        .sort((a, b) => (b.submitted_at || "").localeCompare(a.submitted_at || ""))
        .slice(0, 5),
    };
  }, [assignments, cases, files]);

  const proxied = (path: string) => `/api/file-proxy?path=${encodeURIComponent(path)}`;

  const groupedByCase = useMemo(() => {
    const grouped = new Map<
      string,
      { caseId: number | null; caseTitle: string; docs: ClientDoc[] }
    >();
    for (const file of files) {
      const key = String(file.caseId ?? "unassigned");
      if (!grouped.has(key)) {
        grouped.set(key, { caseId: file.caseId, caseTitle: file.caseTitle, docs: [] });
      }
      grouped.get(key)!.docs.push(file);
    }
    return Array.from(grouped.values());
  }, [files]);

  // Get submissions linked to a specific case
  const getSubmissionsForCase = (caseId: number) => {
    return assignments.filter((a) => a.case_id === caseId);
  };

  if (loading)
    return (
      <div className="py-20 flex items-center justify-center gap-2 text-foreground/50">
        <Loader2 className="animate-spin" /> Loading client profile...
      </div>
    );
  if (error || !client) return <p className="text-red-500 font-bold">{error || "Client not found"}</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/clients">
            <BubbleButton variant="ghost" className="gap-2">
              <ArrowLeft size={16} /> Back
            </BubbleButton>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{client.username}</h1>
            <p className="text-foreground/60">{client.email}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["overview", "cases", "documents", "activity"] as Tab[]).map((t) => (
          <BubbleButton key={t} variant={tab === t ? "primary" : "ghost"} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </BubbleButton>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Stat title="Active Cases" value={stats.activeCases} icon={<FolderKanban size={16} />} />
          <Stat title="Total Documents" value={stats.totalDocuments} icon={<FileText size={16} />} />
          <Stat title="Pending Approvals" value={stats.pendingApprovals} icon={<Activity size={16} />} />
          <Stat title="Rejected/Changes" value={stats.rejected} icon={<UserRound size={16} />} />
          <Stat title="Assignments" value={assignments.length} icon={<FolderKanban size={16} />} />
        </div>
      )}

      {tab === "cases" && (
        <BubbleCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <input
              value={newCaseTitle}
              onChange={(e) => setNewCaseTitle(e.target.value)}
              placeholder="Create new case..."
              className="h-10 px-3 rounded-bubble-sm border-[3px] border-border bg-background min-w-[280px]"
            />
            <BubbleButton
              onClick={async () => {
                if (!newCaseTitle.trim()) return;
                const created = await consultantApi.createCase({
                  client_id: clientId,
                  title: newCaseTitle.trim(),
                  status: "open",
                });
                setCases((prev) => [created, ...prev]);
                setNewCaseTitle("");
              }}
            >
              <Plus size={15} /> Add Case
            </BubbleButton>
          </div>
          <div className="space-y-2">
            {cases.length === 0 ? (
              <p className="text-foreground/50">No cases yet.</p>
            ) : (
              cases.map((c) => {
                const isExpanded = expandedCaseId === c.id;
                const caseSubmissions = getSubmissionsForCase(c.id);
                return (
                  <div key={c.id} className="rounded-bubble-sm border-[2px] border-border overflow-hidden">
                    <div
                      className="p-3 flex items-center justify-between cursor-pointer hover:bg-background/60 transition-colors"
                      onClick={() => setExpandedCaseId(isExpanded ? null : c.id)}
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown size={16} className="text-primary" /> : <ChevronRight size={16} className="text-foreground/40" />}
                        <div>
                          <p className="font-bold">{c.title}</p>
                          <p className="text-xs text-foreground/50">
                            Status: <span className={c.status === "open" ? "text-green-600" : c.status === "closed" ? "text-red-500" : "text-foreground/40"}>{c.status}</span>
                            {" · "}{caseSubmissions.length} submission{caseSubmissions.length !== 1 ? "s" : ""}
                            {" · "}Created {new Date(c.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-foreground/50">#{c.id}</span>
                    </div>

                    {isExpanded && (
                      <div className="border-t-[2px] border-border bg-background/30">
                        {/* Case info */}
                        <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-3 border-b border-border/50">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Case ID</p>
                            <p className="font-bold text-sm">#{c.id}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Status</p>
                            <p className="font-bold text-sm">{c.status}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Created</p>
                            <p className="font-bold text-sm">{new Date(c.created_at).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Last Updated</p>
                            <p className="font-bold text-sm">{c.updated_at ? new Date(c.updated_at).toLocaleDateString() : "N/A"}</p>
                          </div>
                        </div>

                        {/* Linked submissions */}
                        <div className="p-4">
                          <p className="text-xs font-black uppercase tracking-widest text-foreground/40 mb-3">
                            Linked Submissions ({caseSubmissions.length})
                          </p>
                          {caseSubmissions.length === 0 ? (
                            <p className="text-foreground/40 text-sm italic">No submissions linked to this case yet.</p>
                          ) : (
                            <div className="space-y-2">
                              {caseSubmissions.map((a) => (
                                <div key={a.id} className="p-3 rounded-bubble-sm border-[2px] border-border bg-surface flex items-center justify-between">
                                  <div>
                                    <p className="font-semibold text-sm">{a.template?.title || `Form #${a.template_id}`}</p>
                                    <p className="text-xs text-foreground/50">
                                      Assignment #{a.id} · Submitted: {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : "Not yet"}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-bubble-sm border-[2px] ${
                                      a.status === "submitted" ? "bg-green-500/10 text-green-600 border-green-500/30" :
                                      a.status === "reviewed" ? "bg-purple-500/10 text-purple-600 border-purple-500/30" :
                                      a.status === "in_progress" ? "bg-blue-500/10 text-blue-600 border-blue-500/30" :
                                      "bg-red-500/10 text-red-600 border-red-500/30"
                                    }`}>
                                      {a.status.replace("_", " ")}
                                    </span>
                                    {a.requires_changes && (
                                      <span className="text-[10px] font-black uppercase px-2 py-1 rounded-bubble-sm border-[2px] bg-orange-500/10 text-orange-600 border-orange-500/30">
                                        Changes Needed
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </BubbleCard>
      )}

      {tab === "documents" && (
        <>
          {viewer ? (
            <InAppDocViewer url={viewer.url} name={viewer.name} onClose={() => setViewer(null)} />
          ) : (
            <BubbleCard className="p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <BubbleButton variant={selectedCaseFilter === "all" ? "primary" : "ghost"} onClick={() => setSelectedCaseFilter("all")}>
                  All Cases
                </BubbleButton>
                {groupedByCase.map((group) => (
                  <BubbleButton
                    key={String(group.caseId ?? "unassigned")}
                    variant={selectedCaseFilter === String(group.caseId ?? "unassigned") ? "primary" : "ghost"}
                    onClick={() => setSelectedCaseFilter(String(group.caseId ?? "unassigned"))}
                  >
                    {group.caseTitle} ({group.docs.length})
                  </BubbleButton>
                ))}
              </div>

              <div className="space-y-4">
                {files.length === 0 ? (
                  <p className="text-foreground/50">No documents uploaded yet.</p>
                ) : (
                  groupedByCase
                    .filter((group) => selectedCaseFilter === "all" || selectedCaseFilter === String(group.caseId ?? "unassigned"))
                    .map((group) => (
                      <div key={String(group.caseId ?? "unassigned")} className="border-[2px] border-border rounded-bubble-sm">
                        <div className="px-3 py-2 bg-background/60 border-b-[2px] border-border font-bold text-sm">{group.caseTitle}</div>
                        <div className="space-y-2 p-2">
                          {group.docs.map((f, idx) => (
                            <div key={`${f.assignmentId}-${f.fieldId}-${idx}`} className="p-3 rounded-bubble-sm border-[2px] border-border flex items-center justify-between">
                              <div>
                                <p className="font-semibold">{f.name}</p>
                                <p className="text-xs text-foreground/50">Assignment #{f.assignmentId} - Field: {f.fieldId}</p>
                              </div>
                              <button onClick={() => setViewer({ url: proxied(f.url), name: f.name })} className="text-primary font-bold text-sm underline cursor-pointer">
                                View In App
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </BubbleCard>
          )}
        </>
      )}

      {tab === "activity" && (
        <BubbleCard className="p-6">
          <div className="space-y-2">
            {stats.recentActivity.length === 0 ? (
              <p className="text-foreground/50">No activity yet.</p>
            ) : (
              stats.recentActivity.map((a) => (
                <div key={a.id} className="p-3 rounded-bubble-sm border-[2px] border-border">
                  <p className="font-semibold">{a.template?.title || `Form #${a.template_id}`} - {a.status}</p>
                  <p className="text-xs text-foreground/50">Submitted: {a.submitted_at ? new Date(a.submitted_at).toLocaleString() : "N/A"}</p>
                </div>
              ))
            )}
          </div>
        </BubbleCard>
      )}
    </div>
  );
}

function Stat({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <BubbleCard className="p-4 border-t-[4px] border-t-primary">
      <div className="flex items-center justify-between mb-3 text-foreground/60">
        <p className="text-xs font-black uppercase tracking-widest">{title}</p>
        {icon}
      </div>
      <p className="text-3xl font-black">{value}</p>
    </BubbleCard>
  );
}
