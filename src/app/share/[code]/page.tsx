"use client";

import { useEffect, useState, use } from "react";
import { BubbleCard } from "@/components/ui/BubbleCard";
import { BubbleButton } from "@/components/ui/BubbleButton";
import { 
  Loader2, CheckCircle2, AlertCircle, FileText, 
  ChevronRight, Send, HelpCircle 
} from "lucide-react";
import { motion } from "framer-motion";
import { uploadPublicFile } from "@/lib/api";

type FieldType = "text" | "textarea" | "number" | "email" | "phone" | "select" | "checkbox" | "radio" | "file";
type PublicField = { id: string; label: string; required?: boolean; type: FieldType; options?: string[]; placeholder?: string };
type PublicTemplate = { title: string; description?: string; schema_data: { fields: PublicField[] } };

export default function PublicFormPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [template, setTemplate] = useState<PublicTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const res = await fetch(`/api/v1/public/forms/${code}`);
        if (!res.ok) throw new Error("Form not found or sharing disabled");
        const data = await res.json();
        setTemplate(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load form");
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [code]);

  const handleInputChange = (fieldId: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/public/forms/${code}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          data: formData,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      setIsSubmitted(true);
    } catch (err: unknown) {
      setError("Failed to submit: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="animate-spin text-lava-500" size={48} />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <BubbleCard className="max-w-md w-full p-8 text-center border-red-500/20">
        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Oops!</h1>
        <p className="text-foreground/60 mb-6">{error}</p>
        <BubbleButton onClick={() => window.location.reload()}>Try Again</BubbleButton>
      </BubbleCard>
    </div>
  );

  if (isSubmitted) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <BubbleCard className="max-w-md w-full p-10 text-center border-green-500/20">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={48} className="text-green-500" />
          </div>
          <h1 className="text-3xl font-bold mb-3 font-outfit">Submission Successful</h1>
          <p className="text-foreground/60 leading-relaxed mb-8">
            Thank you for your response! Your information has been securely transmitted to the consultant.
          </p>
          <p className="text-xs text-foreground/30 font-bold uppercase tracking-widest">ConsultantOS Secure Transaction</p>
        </BubbleCard>
      </motion.div>
    </div>
  );

  const fields = template?.schema_data?.fields || [];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-lava-500/30">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden -z-10 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-lava-500/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-lava-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-3xl mx-auto py-12 px-6">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lava-500/10 text-lava-500 text-xs font-bold uppercase tracking-wider mb-4">
            <FileText size={14} /> Shared Form
          </div>
          <h1 className="text-4xl sm:text-5xl font-black font-outfit mb-4">{template.title}</h1>
          {template.description && (
            <p className="text-lg text-foreground/60 max-w-xl mx-auto">{template.description}</p>
          )}
        </div>

        <BubbleCard className="p-8 sm:p-12 overflow-visible">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-lg font-bold">Username <span className="text-lava-500">*</span></label>
              <input required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-background border-[3px] border-border rounded-bubble-md p-4 focus:border-lava-500 outline-none transition-all placeholder:text-foreground/20 font-medium" placeholder="Your username" />
            </div>
            <div className="space-y-3">
              <label className="text-lg font-bold">Email <span className="text-lava-500">*</span></label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-background border-[3px] border-border rounded-bubble-md p-4 focus:border-lava-500 outline-none transition-all placeholder:text-foreground/20 font-medium" placeholder="Your email" />
              <p className="text-xs text-foreground/50 font-medium">
                This is required so the consultant can review your submission and request changes on-platform.
              </p>
            </div>
            {fields.map((field: PublicField, idx: number) => (
              <motion.div 
                key={field.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lava-500 font-bold font-mono text-sm opacity-50">{String(idx + 1).padStart(2, '0')}</span>
                  <label className="text-lg font-bold">{field.label}{field.required && <span className="text-lava-500 ml-1">*</span>}</label>
                </div>

                {field.type === "textarea" ? (
                  <textarea
                    required={field.required}
                    className="w-full bg-background border-[3px] border-border rounded-bubble-md p-4 min-h-[120px] focus:border-lava-500 outline-none transition-all placeholder:text-foreground/20 font-medium"
                    placeholder="Enter your response..."
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                  />
                ) : field.type === "select" ? (
                  <div className="relative group">
                    <select
                      required={field.required}
                      className="w-full bg-background border-[3px] border-border rounded-bubble-md p-4 focus:border-lava-500 outline-none transition-all appearance-none font-medium cursor-pointer"
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                    >
                      <option value="">Select an option</option>
                      {field.options?.map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/20 rotate-90 pointer-events-none group-focus-within:text-lava-500 transition-colors" />
                  </div>
                ) : (
                  field.type === "file" ? (
                    <div className="space-y-2">
                      <input
                        type="file"
                        required={field.required}
                        className="w-full bg-background border-[3px] border-border rounded-bubble-md p-4 focus:border-lava-500 outline-none transition-all placeholder:text-foreground/20 font-medium"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const uploaded = await uploadPublicFile(code, file);
                            handleInputChange(field.id, uploaded);
                          } catch (uploadErr: unknown) {
                            setError(uploadErr instanceof Error ? uploadErr.message : "File upload failed");
                          }
                        }}
                      />
                      <p className="text-xs text-foreground/60">{(formData[field.id] as { name?: string } | undefined)?.name || "Max 10MB, documents/images supported."}</p>
                    </div>
                  ) : (
                    <input
                      type={field.type}
                      required={field.required}
                      className="w-full bg-background border-[3px] border-border rounded-bubble-md p-4 focus:border-lava-500 outline-none transition-all placeholder:text-foreground/20 font-medium"
                      placeholder={field.placeholder || "Your answer..."}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                    />
                  )
                )}
              </motion.div>
            ))}

            <div className="pt-6 border-t-[3px] border-border">
              <BubbleButton 
                type="submit" 
                className="w-full h-16 text-xl group"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2" />
                    Securely Sending...
                  </>
                ) : (
                  <>
                    Submit Response
                    <Send className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </>
                )}
              </BubbleButton>
              <div className="flex justify-center mt-6 gap-6 text-foreground/30 font-bold uppercase tracking-tighter text-[10px]">
                <div className="flex items-center gap-1"><HelpCircle size={12} /> Encrypted Submission</div>
                <div className="flex items-center gap-1"><AlertCircle size={12} /> ConsultantOS Verified</div>
              </div>
            </div>
          </form>
        </BubbleCard>
      </div>
    </div>
  );
}
