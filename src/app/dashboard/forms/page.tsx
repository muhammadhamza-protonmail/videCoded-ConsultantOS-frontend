"use client";

import { useEffect, useState } from "react";
import { BubbleCard } from "@/components/ui/BubbleCard";
import { BubbleButton } from "@/components/ui/BubbleButton";
import { Plus, ListTodo, Layers, ArrowRight, Loader2, Trash2, Share2, Globe, Lock, Copy, Check, UserPlus } from "lucide-react";
import Link from "next/link";
import { consultantApi, adminApi, FormTemplate, User } from "@/lib/api";
import { useAuth } from "@/components/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

export default function FormsHubPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sharingTemplate, setSharingTemplate] = useState<FormTemplate | null>(null);
  const [assigningTemplate, setAssigningTemplate] = useState<FormTemplate | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState("");
  const [shareExpiry, setShareExpiry] = useState("");

  const fetchTemplates = () => {
    const fetcher = user?.role === "admin" ? adminApi.getTemplates : consultantApi.getTemplates;
    fetcher()
      .then(setTemplates)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) fetchTemplates();
    if (user?.role === "consultant") {
      consultantApi.getClients().then(setClients).catch(() => {});
    }
  }, [user]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await consultantApi.deleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const handleToggleShare = async (id: number, currentStatus: boolean) => {
    try {
      setShareError("");
      const updated = await consultantApi.updateShareSettings(id, {
        is_public: !currentStatus,
        share_expires_at: shareExpiry ? new Date(shareExpiry).toISOString() : null,
      });
      if (!updated.share_code && updated.is_public) {
        setShareError("This template cannot be shared publicly because it has no share code.");
      }
      setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));
      if (sharingTemplate?.id === id) setSharingTemplate(updated);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to update share status");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getShareLink = (template: FormTemplate) => {
    if (!template.share_code) return "";
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/share/${template.share_code}`;
  };

  const toggleStudent = (studentId: number) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const submitDirectAssign = async () => {
    if (!assigningTemplate || selectedStudents.length === 0) return;
    setAssigning(true);
    try {
      await consultantApi.assignTemplateToStudents(assigningTemplate.id, selectedStudents);
      setAssigningTemplate(null);
      setSelectedStudents([]);
      alert("Form assigned successfully.");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to assign");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Form Templates</h1>
          <p className="text-foreground/60">Create forms, share public links, and assign directly to associate clients.</p>
        </div>
        <Link href="/dashboard/forms/builder">
          <BubbleButton className="gap-2 shrink-0 bg-gradient-to-r from-lava-600 to-lava-500 hover:from-lava-500 hover:to-lava-400">
            <Plus size={18} /> New Form
          </BubbleButton>
        </Link>
      </div>

      {loading && <div className="flex items-center justify-center py-16 gap-3 text-foreground/50"><Loader2 className="animate-spin" /> Loading templates...</div>}
      {error && <p className="text-red-500 font-bold py-8 text-center">{error}</p>}

      {!loading && !error && templates.length === 0 && (
        <BubbleCard className="p-12 flex flex-col items-center justify-center text-center">
          <ListTodo size={48} className="text-foreground/20 mb-4" />
          <p className="font-bold text-xl text-foreground/60">No templates yet</p>
        </BubbleCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template, i) => (
          <motion.div key={template.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <BubbleCard hoverEffect className="p-6 flex flex-col h-full border-t-[6px] border-t-lava-500">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-bubble-sm bg-background shrink-0 flex items-center justify-center border-[3px] border-border shadow-sm"><ListTodo className="text-lava-500 w-6 h-6" /></div>
                <h3 className="font-bold text-xl leading-snug line-clamp-2">{template.title}</h3>
              </div>
              {template.description && <p className="text-sm text-foreground/60 font-medium mb-4 line-clamp-2">{template.description}</p>}
              <div className="flex items-center gap-2 text-sm text-foreground/60 mb-4 font-medium">
                <Layers size={16} /> {Object.keys((template.schema_data as { fields?: unknown[] })?.fields ?? {}).length || "?"} Fields
              </div>
              <div className="mt-auto flex items-center justify-between pt-4 border-t-[3px] border-border/50 gap-2">
                <div className="flex items-center gap-2 ml-auto">
                  {user?.role === "consultant" && (
                    <div className="flex gap-2">
                      <button onClick={() => { setSharingTemplate(template); setShareExpiry(template.share_expires_at ? new Date(template.share_expires_at).toISOString().slice(0, 16) : ""); }} className={`p-2 rounded-bubble-sm transition-colors border-[2px] ${template.is_public ? "text-green-500 border-green-500/20 bg-green-500/5" : "text-foreground/40 border-transparent hover:border-lava-500/20 hover:text-lava-500"}`}>
                        <Share2 size={15} />
                      </button>
                      <button onClick={() => { setAssigningTemplate(template); setSelectedStudents([]); }} className="p-2 rounded-bubble-sm text-foreground/40 hover:text-blue-500 hover:bg-blue-500/10 transition-colors border-[2px] border-transparent hover:border-blue-500/20">
                        <UserPlus size={15} />
                      </button>
                      <button onClick={() => handleDelete(template.id)} className="p-2 rounded-bubble-sm text-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-colors border-[2px] border-transparent hover:border-red-500/20">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                  <Link href={`/dashboard/forms/builder?templateId=${template.id}`}>
                    <BubbleButton variant="ghost" size="sm" className="gap-1 px-3 border-[3px] border-border hover:bg-lava-500/10 hover:border-lava-500 hover:text-lava-500 transition-colors">
                      Edit <ArrowRight className="w-4 h-4" />
                    </BubbleButton>
                  </Link>
                </div>
              </div>
            </BubbleCard>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {sharingTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSharingTemplate(null)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-lg">
              <BubbleCard className="p-8 shadow-2xl border-lava-500/20">
                <h2 className="text-2xl font-bold font-outfit mb-6">Share Form</h2>
                <div className="p-6 rounded-bubble-lg bg-background border-[3px] border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${sharingTemplate.is_public ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>{sharingTemplate.is_public ? <Globe size={20} /> : <Lock size={20} />}</div>
                      <div>
                        <p className="font-bold text-sm">{sharingTemplate.is_public ? "Publicly Shared" : "Private Access Only"}</p>
                        <p className="text-xs text-foreground/40 font-medium">Anyone with the link can {sharingTemplate.is_public ? "respond" : "no longer respond"}</p>
                      </div>
                    </div>
                    <button onClick={() => handleToggleShare(sharingTemplate.id, !!sharingTemplate.is_public)} className={`px-4 py-2 rounded-bubble-sm text-xs font-black uppercase tracking-wider transition-all border-[2px] ${sharingTemplate.is_public ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20" : "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20"}`}>
                      {sharingTemplate.is_public ? "Disable" : "Enable"}
                    </button>
                  </div>
                  {sharingTemplate.is_public && (
                    <div className="pt-4 border-t-[3px] border-border space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Expiry (Optional)</label>
                      <input
                        type="datetime-local"
                        value={shareExpiry}
                        onChange={(e) => setShareExpiry(e.target.value)}
                        className="w-full h-10 px-3 rounded-bubble-sm border-[3px] border-border bg-background focus:outline-none focus:border-lava-500 text-sm"
                      />
                      <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Sharing Link</label>
                      {!sharingTemplate.share_code && <p className="text-xs font-bold text-red-500">Missing share code. Recreate this template to enable public sharing.</p>}
                      {shareError && <p className="text-xs font-bold text-red-500">{shareError}</p>}
                      <div className="flex gap-2">
                        <input readOnly value={getShareLink(sharingTemplate)} className="flex-1 bg-background border-[3px] border-border rounded-bubble-sm p-3 text-sm font-medium focus:border-lava-500 outline-none truncate" />
                        <BubbleButton className="px-4 shrink-0" disabled={!sharingTemplate.share_code} onClick={() => copyToClipboard(getShareLink(sharingTemplate))}>
                          {copied ? <Check size={18} /> : <Copy size={18} />}
                        </BubbleButton>
                      </div>
                    </div>
                  )}
                </div>
              </BubbleCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {assigningTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAssigningTemplate(null)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-xl">
              <BubbleCard className="p-8 shadow-2xl border-blue-500/20">
                <h2 className="text-2xl font-bold mb-2">Assign To Associate Clients</h2>
                <p className="text-sm text-foreground/60 mb-6">Template: <span className="font-bold">{assigningTemplate.title}</span></p>
                <div className="max-h-72 overflow-auto space-y-2">
                  {clients.map((student) => (
                    <label key={student.id} className="flex items-center gap-3 p-3 rounded-bubble-sm border-[2px] border-border hover:border-blue-500/30">
                      <input type="checkbox" checked={selectedStudents.includes(student.id)} onChange={() => toggleStudent(student.id)} />
                      <span className="font-medium">{student.username} <span className="text-foreground/50">({student.email})</span></span>
                    </label>
                  ))}
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <BubbleButton variant="ghost" onClick={() => setAssigningTemplate(null)}>Cancel</BubbleButton>
                  <BubbleButton onClick={submitDirectAssign} disabled={assigning || selectedStudents.length === 0}>{assigning ? "Assigning..." : `Assign (${selectedStudents.length})`}</BubbleButton>
                </div>
              </BubbleCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
