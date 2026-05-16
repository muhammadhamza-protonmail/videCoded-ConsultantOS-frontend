"use client";

import { useEffect, useMemo, useState } from "react";
import { consultantApi } from "@/lib/api";
import { BubbleCard } from "@/components/ui/BubbleCard";
import { BubbleButton } from "@/components/ui/BubbleButton";
import { InAppDocViewer } from "@/components/ui/InAppDocViewer";
import { Loader2, Search, FileText, Eye } from "lucide-react";

type DocRow = {
  assignmentId: number;
  clientName: string;
  formTitle: string;
  fieldId: string;
  name: string;
  url: string;
  submittedAt?: string;
};

export default function DocumentsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<DocRow[]>([]);
  const [viewer, setViewer] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const assignments = await consultantApi.getAssignments();
        const submitted = assignments.filter((a) => a.status !== "not_started");
        const filePayloads = await Promise.all(
          submitted.map(async (a) => {
            try {
              const payload = await consultantApi.getAssignmentFiles(a.id);
              return { assignment: a, files: payload.files };
            } catch {
              return { assignment: a, files: [] };
            }
          })
        );
        const flat: DocRow[] = filePayloads.flatMap(({ assignment, files }) =>
          files.map((f) => ({
            assignmentId: assignment.id,
            clientName: assignment.client?.username || `Client #${assignment.client_id}`,
            formTitle: assignment.template?.title || `Form #${assignment.template_id}`,
            fieldId: f.field_id,
            name: f.name || "Document",
            url: f.url,
            submittedAt: assignment.submitted_at,
          }))
        );
        setRows(flat);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load documents");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      `${r.clientName} ${r.formTitle} ${r.fieldId} ${r.name}`.toLowerCase().includes(q)
    );
  }, [rows, query]);

  const proxied = (path: string) => `/api/file-proxy?path=${encodeURIComponent(path)}`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="text-foreground/60">Global document inbox across your client submissions.</p>
      </div>

      <BubbleCard className="p-6">
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by client, form, field, file..."
            className="w-full h-11 pl-10 pr-4 rounded-bubble-sm border-[3px] border-border bg-background"
          />
        </div>

        {loading && <div className="py-14 flex items-center justify-center gap-2 text-foreground/50"><Loader2 className="animate-spin" /> Loading documents...</div>}
        {error && <p className="text-red-500 font-bold">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-[3px] border-border/80">
                  <th className="pb-3 text-xs font-black uppercase tracking-widest text-foreground/50">Document</th>
                  <th className="pb-3 text-xs font-black uppercase tracking-widest text-foreground/50">Client</th>
                  <th className="pb-3 text-xs font-black uppercase tracking-widest text-foreground/50">Form</th>
                  <th className="pb-3 text-xs font-black uppercase tracking-widest text-foreground/50">Submitted</th>
                  <th className="pb-3 text-xs font-black uppercase tracking-widest text-foreground/50 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y-[2px] divide-border/40">
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="py-16 text-center text-foreground/40 font-semibold">No documents found.</td></tr>
                ) : filtered.map((row) => (
                  <tr key={`${row.assignmentId}-${row.fieldId}-${row.name}`} className="hover:bg-background/50">
                    <td className="py-4 font-semibold flex items-center gap-2"><FileText size={14} className="text-primary" /> {row.name}</td>
                    <td className="py-4">{row.clientName}</td>
                    <td className="py-4">{row.formTitle}</td>
                    <td className="py-4 text-sm text-foreground/60">{row.submittedAt ? new Date(row.submittedAt).toLocaleString() : "N/A"}</td>
                    <td className="py-4 text-right">
                      <BubbleButton size="sm" variant="ghost" className="gap-2" onClick={() => setViewer({ url: proxied(row.url), name: row.name })}>
                        <Eye size={14} /> View In App
                      </BubbleButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </BubbleCard>
      {viewer && <InAppDocViewer url={viewer.url} name={viewer.name} onClose={() => setViewer(null)} />}
    </div>
  );
}
