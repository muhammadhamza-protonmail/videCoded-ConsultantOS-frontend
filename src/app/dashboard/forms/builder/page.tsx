"use client";

import { useEffect, useState } from "react";
import { BubbleCard } from "@/components/ui/BubbleCard";
import { BubbleButton } from "@/components/ui/BubbleButton";
import { 
  Type, SquareChartGantt, CheckSquare, Save, 
  Plus, Loader2, CheckCircle2, FileUp, 
  Hash, Mail, Phone, List, Radio, Eye, EyeOff, Trash2, PlusCircle,
  ChevronUp, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { consultantApi } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";

// Expanded field types
type FieldType = "text" | "textarea" | "number" | "email" | "phone" | "select" | "checkbox" | "radio" | "file";

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  options?: string[]; // For select, radio, checkbox-group
}

export default function FormBuilderStudio() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingTemplateId = Number(searchParams.get("templateId") || 0) || null;
  const [fields, setFields] = useState<FormField[]>([]);
  const [formTitle, setFormTitle] = useState("Untitled Client Form");
  const [formDesc, setFormDesc] = useState("Please fill out the following details for your preliminary consultation.");
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  useEffect(() => {
    const loadTemplate = async () => {
      if (!editingTemplateId) return;
      setLoadingTemplate(true);
      try {
        const tpl = await consultantApi.getTemplateById(editingTemplateId);
        setFormTitle(tpl.title);
        setFormDesc(tpl.description || "");
        const schema = tpl.schema_data as { fields?: FormField[] };
        setFields(schema.fields || []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load template");
      } finally {
        setLoadingTemplate(false);
      }
    };
    loadTemplate();
  }, [editingTemplateId]);

  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: crypto.randomUUID(),
      type,
      label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      required: false,
    };
    // Initialize empty options for selection types
    if (["select", "radio", "checkbox"].includes(type)) {
      newField.options = ["Option 1"];
    }
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => setFields(fields.filter((f) => f.id !== id));

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map((f) => f.id === id ? { ...f, ...updates } : f));
  };

  const addOption = (fieldId: string) => {
    setFields(fields.map(f => {
      if (f.id === fieldId) {
        return { ...f, options: [...(f.options || []), `Option ${(f.options?.length || 0) + 1}`] };
      }
      return f;
    }));
  };

  const updateOption = (fieldId: string, index: number, value: string) => {
    setFields(fields.map(f => {
      if (f.id === fieldId && f.options) {
        const newOptions = [...f.options];
        newOptions[index] = value;
        return { ...f, options: newOptions };
      }
      return f;
    }));
  };

  const removeOption = (fieldId: string, index: number) => {
    setFields(fields.map(f => {
      if (f.id === fieldId && f.options) {
        return { ...f, options: f.options.filter((_, i) => i !== index) };
      }
      return f;
    }));
  };

  const moveField = (index: number, direction: "up" | "down") => {
    const newFields = [...fields];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFields.length) return;
    
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    setFields(newFields);
  };

  const handlePublish = async () => {
    if (!formTitle.trim()) { setError("Please give your form a title."); return; }
    if (fields.length === 0) { setError("Add at least one field before publishing."); return; }

    setError("");
    setSaving(true);
    try {
      if (editingTemplateId) {
        await consultantApi.updateTemplate(editingTemplateId, {
          title: formTitle,
          description: formDesc,
          schema_data: { fields },
        });
      } else {
        await consultantApi.createTemplate({
          title: formTitle,
          description: formDesc,
          schema_data: { fields },
          is_global: false,
        });
      }
      setSaved(true);
      setTimeout(() => router.push("/dashboard/forms"), 1500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save form");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-6.5rem)] gap-4 overflow-hidden">

      {/* Toolbox Pane - Robust Scrolling */}
      <div className="w-64 xl:w-72 flex flex-col shrink-0 overflow-hidden border border-border rounded-bubble-lg bg-surface/70">
        <div className="p-3 border-b border-border bg-background/60 flex items-center justify-between">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Plus className="text-lava-500" size={20} /> Toolbox
          </h2>
          <BubbleButton 
            variant="ghost" 
            size="sm" 
            className="w-10 h-10 p-0 rounded-full"
            onClick={() => setShowPreview(!showPreview)}
            title={showPreview ? "Hide JSON" : "Show JSON"}
          >
            {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
          </BubbleButton>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 custom-scrollbar pb-10">
          <div className="flex flex-col gap-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mt-2 mb-1">Standard Inputs</h3>
            <ToolButton icon={<Type size={16} />} label="Short Text" onClick={() => addField("text")} />
            <ToolButton icon={<SquareChartGantt size={16} />} label="Paragraph" onClick={() => addField("textarea")} />
            <ToolButton icon={<Hash size={16} />} label="Number" onClick={() => addField("number")} />
            <ToolButton icon={<Mail size={16} />} label="Email" onClick={() => addField("email")} />
            <ToolButton icon={<Phone size={16} />} label="Phone" onClick={() => addField("phone")} />
            
            <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mt-4 mb-1">Selection</h3>
            <ToolButton icon={<List size={16} />} label="Drop Down" onClick={() => addField("select")} />
            <ToolButton icon={<CheckSquare size={16} />} label="Checkboxes" onClick={() => addField("checkbox")} />
            <ToolButton icon={<Radio size={16} />} label="Radio Group" onClick={() => addField("radio")} />
            
            <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mt-4 mb-1">Advanced</h3>
            <ToolButton icon={<FileUp size={16} />} label="File Upload" onClick={() => addField("file")} />
          </div>

          {showPreview && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-2">JSON Schema</h3>
              <div className="p-4 bg-background border-[2px] border-border rounded-bubble-sm shadow-inner">
                <pre className="text-[10px] text-lava-500 overflow-auto max-h-96 whitespace-pre-wrap font-mono leading-relaxed">
                  {JSON.stringify({ fields }, null, 2)}
                </pre>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Canvas Pane */}
      <div className="flex-1 flex flex-col overflow-hidden pb-3">
        <div className="flex items-center justify-between mb-4 shrink-0 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{editingTemplateId ? "Edit Form Template" : "Form Studio"}</h1>
            <p className="text-sm text-foreground/60 font-medium">Drag-and-drop workflow (Coming soon) — Use buttons for now.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {error && <span className="text-sm font-bold text-red-500">{error}</span>}
            <BubbleButton
              onClick={handlePublish}
              disabled={saving || saved}
              className={`gap-2 h-11 px-6 ${saved ? "bg-green-500 border-green-600" : ""}`}
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : saved ? <CheckCircle2 size={18} /> : <Save size={18} />}
              {saved ? "Saved & Redirecting..." : editingTemplateId ? "Update Form" : "Publish Form"}
            </BubbleButton>
          </div>
        </div>
        {loadingTemplate && <p className="text-sm font-semibold text-foreground/70 mb-2">Loading template...</p>}

        <BubbleCard className="flex-1 p-0 overflow-y-auto bg-background/40 border border-border relative">
          <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

          <div className="max-w-5xl mx-auto flex flex-col gap-3 p-5 lg:p-6 relative z-10 min-h-full">
            {/* Form title & description */}
            <div className="border-b border-border pb-4 mb-4">
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="text-3xl lg:text-4xl font-extrabold bg-transparent outline-none w-full placeholder:text-foreground/30 focus:text-lava-500 transition-colors"
                placeholder="Form Title"
              />
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                className="text-foreground/80 font-medium bg-transparent outline-none w-full mt-2 resize-none h-11"
                placeholder="Brief description of this form's purpose..."
              />
            </div>

            {/* Fields */}
            {fields.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-foreground/20 border-[3px] bg-background/20 border-dashed border-border/40 rounded-bubble-lg h-80">
                <Plus size={48} className="mb-4 opacity-10" />
                <p className="font-bold text-xl">Canvas is empty</p>
                <p className="text-sm font-medium">Add fields from the toolbox to start building.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 pb-10">
                <AnimatePresence mode="popLayout">
                  {fields.map((field, index) => (
                    <motion.div
                      key={field.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="group bg-surface border border-border hover:border-lava-500 shadow-sm p-4 rounded-bubble-sm flex gap-3 transition-all"
                    >
                      {/* Move Handles */}
                      <div className="flex flex-col gap-1 shrink-0 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => moveField(index, "up")}
                          disabled={index === 0}
                          className="p-1.5 rounded-bubble-sm hover:bg-lava-500/10 text-foreground/40 hover:text-lava-600 disabled:opacity-0"
                        >
                          <ChevronUp size={20} />
                        </button>
                        <button 
                          onClick={() => moveField(index, "down")}
                          disabled={index === fields.length - 1}
                          className="p-1.5 rounded-bubble-sm hover:bg-lava-500/10 text-foreground/40 hover:text-lava-600 disabled:opacity-0"
                        >
                          <ChevronDown size={20} />
                        </button>
                      </div>

                      <div className="flex-1 flex flex-col gap-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex flex-col gap-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded bg-foreground/5 border border-border text-foreground/40 uppercase tracking-tighter`}>
                                {field.type}
                              </span>
                              <input
                                type="text"
                                value={field.label}
                                onChange={(e) => updateField(field.id, { label: e.target.value })}
                                className="font-bold text-lg bg-transparent border-b-2 border-transparent focus:border-lava-500 focus:outline-none w-full pb-1"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-3 bg-background px-3 py-1.5 rounded-bubble-sm border border-border/60">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={field.required} 
                                onChange={() => updateField(field.id, { required: !field.required })}
                                className="w-4 h-4 rounded-md border-border text-lava-600 focus:ring-lava-500" 
                              />
                              <span className="text-[10px] font-black uppercase text-foreground/60">Required</span>
                            </label>
                            <button onClick={() => removeField(field.id)} className="text-red-500 hover:text-red-600">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Rendering Preview Based on Type */}
                        <div className="bg-background/55 rounded-bubble-sm p-3 border border-border/50">
                          {field.type === "text" && <p className="text-foreground/40 text-sm font-medium">Short answer input box</p>}
                          {field.type === "textarea" && <p className="text-foreground/40 text-sm font-medium">Multi-line message area</p>}
                          {field.type === "number" && <p className="text-foreground/40 text-sm font-medium">Numeric only input</p>}
                          {field.type === "email" && <p className="text-foreground/40 text-sm font-medium">Valid email address format</p>}
                          {field.type === "phone" && <p className="text-foreground/40 text-sm font-medium">Phone number input</p>}
                          {field.type === "file" && (
                            <div className="flex items-center gap-2 text-lava-500/60 font-bold">
                              <FileUp size={18} /> Upload Zone
                            </div>
                          )}

                          {/* Options Manager for multi-choice fields */}
                          {["select", "radio", "checkbox"].includes(field.type) && (
                            <div className="flex flex-col gap-3">
                              <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Manage Options</p>
                              <div className="flex flex-wrap gap-2">
                                {field.options?.map((opt, idx) => (
                                  <div key={idx} className="flex items-center gap-1 bg-surface border-[2px] border-border rounded-bubble-sm px-2 py-1">
                                    <input 
                                      type="text" 
                                      value={opt} 
                                      onChange={(e) => updateOption(field.id, idx, e.target.value)}
                                      className="bg-transparent text-sm font-bold focus:outline-none w-24 text-foreground/80 focus:text-lava-500"
                                    />
                                    <button onClick={() => removeOption(field.id, idx)} className="text-red-500 hover:text-red-600 p-1">
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                ))}
                                <button 
                                  onClick={() => addOption(field.id)}
                                  className="flex items-center gap-1 text-xs font-bold text-lava-500 hover:bg-lava-500/10 px-2 py-1 rounded-bubble-sm border-[2px] border-dashed border-lava-500/30"
                                >
                                  <PlusCircle size={14} /> Add Option
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </BubbleCard>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

function ToolButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-bubble-sm border-[3px] border-border bg-background hover:border-lava-500 hover:text-lava-600 dark:hover:text-lava-400 transition-all font-bold text-sm text-left group shrink-0"
    >
      <div className="p-1.5 rounded-bubble-sm bg-surface border-[2px] border-border group-hover:bg-lava-500/10 group-hover:border-lava-500/30 transition-colors">
        {icon}
      </div>
      {label}
    </button>
  );
}
