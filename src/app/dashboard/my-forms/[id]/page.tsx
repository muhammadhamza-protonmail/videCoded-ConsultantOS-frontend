"use client";

import { useEffect, useState, use } from "react";
import { BubbleCard } from "@/components/ui/BubbleCard";
import { BubbleButton } from "@/components/ui/BubbleButton";
import { ChevronLeft, Send, Loader2, CheckCircle2, ClipboardList, AlertCircle, FileUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clientApi, Assignment } from "@/lib/api";
import { motion } from "framer-motion";

export default function FormSubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    clientApi.getAssignment(Number(id))
      .then((data) => {
        setAssignment(data);
        if (data.form_data) {
          setFormData(data.form_data);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const isFieldEditable = (fieldId: string) => {
    // Fully approved — all fields locked
    if (assignment?.status === "reviewed" && !assignment?.requires_changes) return false;
    // Changes requested — only rejected fields are editable
    if (assignment?.requires_changes) {
      const review = assignment.field_reviews?.[fieldId];
      return review?.ok === false;
    }
    return true;
  };

  const handleCheckboxGroupChange = (fieldId: string, option: string, checked: boolean) => {
    const current = (formData[fieldId] as string[]) || [];
    if (checked) {
      setFormData((prev) => ({ ...prev, [fieldId]: [...current, option] }));
    } else {
      setFormData((prev) => ({ ...prev, [fieldId]: current.filter(o => o !== option) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await clientApi.submitAssignment(Number(id), formData);
      setSubmitted(true);
      setTimeout(() => router.push("/dashboard/my-forms"), 2000);
    } catch (e: any) {
      setError(e.message || "Failed to submit form");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24 gap-3 text-foreground/50">
      <Loader2 className="animate-spin" /> Loading form structure…
    </div>
  );

  if (error || !assignment || !assignment.template) return (
    <div className="max-w-xl mx-auto py-24">
      <BubbleCard className="p-8 text-center flex flex-col items-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error Loading Form</h2>
        <p className="text-foreground/60 mb-6">{error || "The form data could not be retrieved."}</p>
        <Link href="/dashboard/my-forms">
          <BubbleButton>Back to My Forms</BubbleButton>
        </Link>
      </BubbleCard>
    </div>
  );

  const fields = (assignment.template.schema_data as any).fields || [];

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/my-forms">
          <BubbleButton variant="ghost" className="w-10 h-10 p-0 rounded-full border-0">
            <ChevronLeft size={20} />
          </BubbleButton>
        </Link>
      <div>
          <h1 className="text-2xl font-bold tracking-tight">{assignment.template.title}</h1>
          <p className="text-sm text-foreground/60 font-medium">{assignment.template.description}</p>
        </div>
      </div>

      {/* Review status banner */}
      {assignment.status === "reviewed" && !assignment.requires_changes && (
        <BubbleCard className="p-5 border-l-[6px] border-l-green-500 bg-green-500/5">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={22} className="text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-green-700 dark:text-green-400 text-lg">Submission Approved</p>
              <p className="text-sm text-foreground/60 mt-1">Your consultant has reviewed and approved all fields.</p>
              {assignment.review_summary && (
                <div className="mt-3 p-3 rounded-bubble-sm bg-green-500/10 border-[2px] border-green-500/20">
                  <p className="text-[10px] font-black uppercase tracking-widest text-green-600/70 mb-1">Consultant&apos;s Comment</p>
                  <p className="text-sm font-medium text-foreground/80">{assignment.review_summary}</p>
                </div>
              )}
            </div>
          </div>
        </BubbleCard>
      )}

      {assignment.requires_changes && (
        <BubbleCard className="p-5 border-l-[6px] border-l-red-500 bg-red-500/5">
          <div className="flex items-start gap-3">
            <AlertCircle size={22} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-700 dark:text-red-400 text-lg">Changes Requested</p>
              <p className="text-sm text-foreground/60 mt-1">Your consultant has flagged some fields for correction. Rejected fields are editable below — approved fields are locked.</p>
              {assignment.review_summary && (
                <div className="mt-3 p-3 rounded-bubble-sm bg-red-500/10 border-[2px] border-red-500/20">
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-600/70 mb-1">Consultant&apos;s Comment</p>
                  <p className="text-sm font-medium text-foreground/80">{assignment.review_summary}</p>
                </div>
              )}
            </div>
          </div>
        </BubbleCard>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <BubbleCard className="p-8 shadow-xl relative overflow-hidden">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-green-500/10 border-[3px] border-green-500/30 rounded-full flex items-center justify-center text-green-600 mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Form Submitted Successfully!</h2>
              <p className="text-foreground/60 font-medium">Your consultant will review it shortly. Redirecting...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              <div className="flex flex-col gap-8">
                {fields.map((field: any) => (
                  <div key={field.id} className="flex flex-col gap-3">
                    <label className="text-sm font-black uppercase tracking-wider text-foreground/60 flex items-center gap-2">
                      {field.label}
                      {field.required && <span className="text-red-500 text-xs">*</span>}
                    </label>
                    
                    {/* Render inputs based on type */}
                    {(field.type === "text" || field.type === "number" || field.type === "email" || field.type === "phone") && (
                      <input
                        type={field.type === "phone" ? "tel" : field.type}
                        required={field.required}
                        value={formData[field.id] || ""}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        className="h-12 px-4 rounded-bubble-sm border-[3px] border-border bg-background focus:outline-none focus:border-lava-500 transition-colors font-medium"
                        placeholder={`Enter your ${field.label.toLowerCase()}...`}
                        disabled={!isFieldEditable(field.id)}
                      />
                    )}

                    {field.type === "textarea" && (
                      <textarea
                        required={field.required}
                        value={formData[field.id] || ""}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        className="h-32 p-4 rounded-bubble-sm border-[3px] border-border bg-background focus:outline-none focus:border-lava-500 transition-colors font-medium leading-relaxed"
                        placeholder="Write your detailed response..."
                        disabled={!isFieldEditable(field.id)}
                      />
                    )}

                    {field.type === "select" && (
                      <select
                        required={field.required}
                        value={formData[field.id] || ""}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        className="h-12 px-4 rounded-bubble-sm border-[3px] border-border bg-background focus:outline-none focus:border-lava-500 transition-colors font-bold cursor-pointer"
                        disabled={!isFieldEditable(field.id)}
                      >
                        <option value="">Select an option...</option>
                        {field.options?.map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}

                    {field.type === "radio" && (
                      <div className="flex flex-col gap-2">
                        {field.options?.map((opt: string) => (
                          <label key={opt} className="flex items-center gap-3 p-3 rounded-bubble-sm border-[2px] border-border hover:border-lava-500 transition-colors cursor-pointer bg-background/50">
                            <input
                              type="radio"
                              name={field.id}
                              required={field.required}
                              checked={formData[field.id] === opt}
                              onChange={() => handleInputChange(field.id, opt)}
                              className="w-4 h-4 text-lava-600 focus:ring-lava-500"
                              disabled={!isFieldEditable(field.id)}
                            />
                            <span className="font-bold text-sm text-foreground/80">{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {field.type === "checkbox" && (
                      <div className="flex flex-col gap-2">
                        {field.options?.map((opt: string) => (
                           <label key={opt} className="flex items-center gap-3 p-3 rounded-bubble-sm border-[2px] border-border hover:border-lava-500 transition-colors cursor-pointer bg-background/50">
                           <input
                             type="checkbox"
                             checked={(formData[field.id] as string[] || []).includes(opt)}
                             onChange={(e) => handleCheckboxGroupChange(field.id, opt, e.target.checked)}
                             className="w-4 h-4 rounded text-lava-600 focus:ring-lava-500"
                             disabled={!isFieldEditable(field.id)}
                           />
                           <span className="font-bold text-sm text-foreground/80">{opt}</span>
                         </label>
                        ))}
                        {(!field.options || field.options.length === 0) && (
                          <label className="flex items-center gap-3 p-3 rounded-bubble-sm border-[2px] border-border hover:border-lava-500 transition-colors cursor-pointer bg-background/50">
                            <input
                              type="checkbox"
                              checked={!!formData[field.id]}
                              onChange={(e) => handleInputChange(field.id, e.target.checked)}
                              className="w-4 h-4 rounded text-lava-600 focus:ring-lava-500"
                              disabled={!isFieldEditable(field.id)}
                            />
                            <span className="font-bold text-sm text-foreground/80">Yes, I acknowledge this</span>
                          </label>
                        )}
                      </div>
                    )}

                    {field.type === "file" && (
                       <div className="flex flex-col gap-2">
                        <label className="w-full h-24 border-[3px] border-dashed border-border rounded-bubble-sm bg-background/50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-lava-500 transition-colors group">
                          <input 
                            type="file" 
                            className="hidden"
                            disabled={!isFieldEditable(field.id)}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const uploaded = await clientApi.uploadFieldFile(file);
                                handleInputChange(field.id, uploaded);
                              } catch (uploadErr: unknown) {
                                setError(uploadErr instanceof Error ? uploadErr.message : "File upload failed");
                              }
                            }} 
                          />
                          <FileUp className="text-foreground/30 group-hover:text-lava-500 animate-pulse" />
                          <span className="text-xs font-bold text-foreground/50">
                            {formData[field.id]?.name || "Click to browse or drag and drop"}
                          </span>
                        </label>
                      </div>
                    )}
                    {assignment.field_reviews?.[field.id]?.ok === false && (
                      <div className="p-3 rounded-bubble-sm border-[2px] border-red-500/40 bg-red-500/10 text-red-600 text-sm font-bold">
                        Flagged by consultant: {assignment.field_reviews[field.id]?.comment || "Please revise this field."}
                      </div>
                    )}
                    {assignment.field_reviews?.[field.id]?.ok === true && assignment.requires_changes && (
                      <div className="p-2 rounded-bubble-sm border-[2px] border-green-500/30 bg-green-500/10 text-green-600 text-xs font-bold">
                        Approved and locked.
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t-[3px] border-border pt-8 flex items-center justify-between">
                <div className="text-xs font-medium text-foreground/40 flex items-center gap-2">
                  <ClipboardList size={14} /> Assignment ID: #{id}
                </div>
                {assignment.status === "reviewed" && !assignment.requires_changes ? (
                  <span className="text-sm font-bold text-green-600 flex items-center gap-2">
                    <CheckCircle2 size={16} /> All fields approved — read only
                  </span>
                ) : (
                  <BubbleButton 
                    type="submit" 
                    disabled={submitting} 
                    className="gap-2 px-8 py-3 h-auto text-lg"
                  >
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    {assignment.requires_changes ? "Resubmit Corrections" : "Submit Response"}
                  </BubbleButton>
                )}
              </div>
            </form>
          )}
        </BubbleCard>
      </motion.div>
    </div>
  );
}
