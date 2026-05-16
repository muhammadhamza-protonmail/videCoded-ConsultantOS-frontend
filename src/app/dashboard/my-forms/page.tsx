"use client";

import { useEffect, useState } from "react";
import { BubbleCard } from "@/components/ui/BubbleCard";
import { BubbleButton } from "@/components/ui/BubbleButton";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClipboardList, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { clientApi, Assignment } from "@/lib/api";

const STATUS_CONFIG = {
  not_started: { label: "Not Started", icon: <Clock size={14} />, color: "text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/30" },
  in_progress:  { label: "In Progress",  icon: <AlertCircle size={14} />, color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30" },
  submitted:    { label: "Submitted",     icon: <CheckCircle2 size={14} />, color: "text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/30" },
  reviewed:     { label: "Reviewed",      icon: <CheckCircle2 size={14} />, color: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/30" },
};

export default function MyFormsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    clientApi.getMyAssignments()
      .then(setAssignments)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleStart = async (id: number) => {
    try {
      await clientApi.startAssignment(id);
      router.push(`/dashboard/my-forms/${id}`);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to start");
    }
  };

  const pending = assignments.filter((a) => a.status === "not_started").length;
  const inProgress = assignments.filter((a) => a.status === "in_progress").length;
  const submitted = assignments.filter((a) => ["submitted", "reviewed"].includes(a.status)).length;

  if (loading) return (
    <div className="flex items-center justify-center py-16 gap-3 text-foreground/50">
      <Loader2 className="animate-spin" /> Loading your forms…
    </div>
  );

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">My Forms</h1>
        <p className="text-foreground/60">Forms your consultant has assigned to you.</p>
      </div>

      {error && <p className="text-red-500 font-bold">{error}</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total",       value: assignments.length, color: "border-t-border" },
          { label: "Pending",     value: pending,            color: "border-t-yellow-500" },
          { label: "In Progress", value: inProgress,         color: "border-t-blue-500" },
          { label: "Completed",   value: submitted,          color: "border-t-green-500" },
        ].map((s) => (
          <BubbleCard key={s.label} className={`p-4 border-t-[6px] ${s.color} flex flex-col gap-1`}>
            <span className="text-2xl font-black">{s.value}</span>
            <span className="text-sm font-medium text-foreground/60">{s.label}</span>
          </BubbleCard>
        ))}
      </div>

      {assignments.length === 0 ? (
        <BubbleCard className="p-12 flex flex-col items-center text-center">
          <ClipboardList size={48} className="text-foreground/20 mb-4" />
          <p className="font-bold text-xl text-foreground/60">No forms assigned yet</p>
          <p className="text-foreground/40 font-medium mt-1">Your consultant will assign forms here.</p>
        </BubbleCard>
      ) : (
        <div className="flex flex-col gap-4">
          {assignments.map((assignment, i) => {
            const status = STATUS_CONFIG[assignment.status];
            const canStart = assignment.status === "not_started";
            const canContinue = assignment.status === "in_progress";
            const isCompleted = ["submitted", "reviewed"].includes(assignment.status);
            
            return (
              <motion.div key={assignment.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                <BubbleCard hoverEffect className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-bubble-sm bg-background border-[3px] border-border flex items-center justify-center shrink-0 shadow-sm">
                      <ClipboardList className="text-lava-500 w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Form #{assignment.template_id}</h3>
                      <p className="text-sm text-foreground/60 font-medium">Assignment ID: {assignment.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-bubble-sm border-[3px] text-xs font-black ${status.color}`}>
                      {status.icon} {status.label}
                    </span>
                    {canStart && (
                      <BubbleButton size="sm" onClick={() => handleStart(assignment.id)}>
                        Start Form
                      </BubbleButton>
                    )}
                    {canContinue && (
                      <BubbleButton size="sm" onClick={() => router.push(`/dashboard/my-forms/${assignment.id}`)}>
                        Continue
                      </BubbleButton>
                    )}
                    {isCompleted && (
                      <BubbleButton size="sm" variant="secondary" onClick={() => router.push(`/dashboard/my-forms/${assignment.id}`)}>
                        View Results
                      </BubbleButton>
                    )}
                  </div>
                </BubbleCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
