"use client";

import { useEffect, useState } from "react";
import { BubbleCard } from "@/components/ui/BubbleCard";
import { BubbleButton } from "@/components/ui/BubbleButton";
import { Search, UserPlus, MoreVertical, Loader2, ClipboardPlus, X, CheckCircle2 } from "lucide-react";
import { consultantApi, User, FormTemplate } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function ClientsPage() {
  const [clients, setClients] = useState<User[]>([]);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Assignment Modal State
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | "">("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [assignError, setAssignError] = useState("");

  useEffect(() => {
    Promise.all([
      consultantApi.getClients(),
      consultantApi.getTemplates()
    ]).then(([clientsData, templatesData]) => {
      setClients(clientsData);
      setTemplates(templatesData);
    }).catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !selectedTemplateId) return;

    setIsAssigning(true);
    setAssignError("");
    try {
      await consultantApi.createAssignment({
        client_id: selectedClient.id,
        template_id: Number(selectedTemplateId)
      });
      setAssignSuccess(true);
      setTimeout(() => {
        setSelectedClient(null);
        setSelectedTemplateId("");
        setAssignSuccess(false);
      }, 2000);
    } catch (e: unknown) {
      setAssignError(e instanceof Error ? e.message : "Failed to assign form");
    } finally {
      setIsAssigning(false);
    }
  };

  const filtered = clients.filter(
    (c) =>
      c.username.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Associate Clients</h1>
          <p className="text-foreground/60">Manage your roster and assign forms to your associate clients.</p>
        </div>
        <BubbleButton className="gap-2 shrink-0"><UserPlus size={18} /> Add Client</BubbleButton>
      </div>

      <BubbleCard className="p-6">
        <div className="relative w-full max-w-sm mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
          <input
            type="text"
            placeholder="Search clients..."
            className="w-full h-11 pl-10 pr-4 rounded-bubble-sm border-[3px] border-border bg-background focus:outline-none focus:border-lava-500 transition-colors font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12 gap-3 text-foreground/50">
            <Loader2 className="animate-spin" /> Loading data…
          </div>
        )}
        {error && (
          <p className="text-red-500 font-bold py-8 text-center">{error}</p>
        )}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-[3px] border-border">
                  {["Username", "Email", "Status", "Actions"].map((h) => (
                    <th key={h} className="pb-3 font-bold text-foreground/70 text-sm">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={4} className="py-12 text-center text-foreground/50 font-medium">No clients found</td></tr>
                ) : filtered.map((client, i) => (
                  <motion.tr
                    key={client.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-border/50 hover:bg-background/50 transition-colors group"
                  >
                    <td className="py-4 font-bold flex items-center gap-3">
                      <div className="w-9 h-9 rounded-bubble-sm bg-gradient-to-tr from-lava-600 to-lava-400 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                        {client.username[0].toUpperCase()}
                      </div>
                      {client.username}
                    </td>
                    <td className="py-4 text-foreground/70 font-medium">{client.email}</td>
                    <td className="py-4">
                      <span className={`px-2.5 py-1 rounded-bubble-sm text-xs font-black border-[2px] ${client.is_active ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30" : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"}`}>
                        {client.is_active ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/clients/${client.id}`}>
                          <BubbleButton variant="secondary" size="sm" className="gap-1.5">
                            View Profile
                          </BubbleButton>
                        </Link>
                        <BubbleButton 
                          variant="ghost" 
                          size="sm" 
                          className="gap-1.5 border-[2px] border-border"
                          onClick={() => setSelectedClient(client)}
                        >
                          <ClipboardPlus size={14} /> Assign Form
                        </BubbleButton>
                        <BubbleButton variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-full border-0">
                          <MoreVertical size={16} />
                        </BubbleButton>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </BubbleCard>

      {/* Assignment Modal */}
      <AnimatePresence>
        {selectedClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md"
            >
              <BubbleCard className="p-8 shadow-2xl relative">
                <button 
                  onClick={() => setSelectedClient(null)}
                  className="absolute top-4 right-4 text-foreground/40 hover:text-foreground transition-colors"
                >
                  <X size={20} />
                </button>

                <h2 className="text-2xl font-bold mb-2">Assign Form</h2>
                <p className="text-foreground/60 text-sm mb-6">
                  Choose a template to assign to <span className="font-bold text-lava-600">{selectedClient.username}</span>.
                </p>

                <form onSubmit={handleAssignSubmit} className="flex flex-col gap-6">
                  {assignError && (
                    <div className="p-3 bg-red-500/10 border-[3px] border-red-500/30 rounded-bubble-sm text-red-600 dark:text-red-400 text-sm font-bold flex items-center gap-2">
                      <X size={16} /> {assignError}
                    </div>
                  )}

                  {assignSuccess && (
                    <div className="p-3 bg-green-500/10 border-[3px] border-green-500/30 rounded-bubble-sm text-green-600 dark:text-green-400 text-sm font-bold flex items-center gap-2">
                      <CheckCircle2 size={16} /> Assignment successful!
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-foreground/50">Select Template</label>
                    <select
                      required
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="h-11 px-4 rounded-bubble-sm border-[3px] border-border bg-background focus:outline-none focus:border-lava-500 transition-colors font-bold cursor-pointer"
                    >
                      <option value="" disabled>Choose a template...</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3 mt-2">
                    <BubbleButton 
                      type="button" 
                      variant="ghost" 
                      className="flex-1"
                      onClick={() => setSelectedClient(null)}
                    >
                      Cancel
                    </BubbleButton>
                    <BubbleButton 
                      type="submit" 
                      disabled={isAssigning || assignSuccess || !selectedTemplateId} 
                      className="flex-1"
                    >
                      {isAssigning ? <Loader2 size={18} className="animate-spin" /> : "Confirm Assignment"}
                    </BubbleButton>
                  </div>
                </form>
              </BubbleCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
