"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CheckSquare,
  FileUp,
  GripVertical,
  Hash,
  List,
  Loader2,
  PanelRightOpen,
  Phone,
  Plus,
  PlusCircle,
  Radio,
  Save,
  SquareChartGantt,
  Trash2,
  Type,
} from "lucide-react";
import { DndContext, DragEndEvent, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { consultantApi } from "@/lib/api";
import { BubbleButton } from "@/components/ui/BubbleButton";
import { useRouter, useSearchParams } from "next/navigation";

type FieldType = "text" | "textarea" | "number" | "email" | "phone" | "select" | "checkbox" | "radio" | "file";

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  options?: string[];
}

const palette: Array<{ type: FieldType; label: string; icon: React.ReactNode; group: "Input" | "Choice" | "Document" }> = [
  { type: "text", label: "Short text", icon: <Type size={16} />, group: "Input" },
  { type: "textarea", label: "Long answer", icon: <SquareChartGantt size={16} />, group: "Input" },
  { type: "number", label: "Number", icon: <Hash size={16} />, group: "Input" },
  { type: "phone", label: "Phone", icon: <Phone size={16} />, group: "Input" },
  { type: "select", label: "Dropdown", icon: <List size={16} />, group: "Choice" },
  { type: "radio", label: "Single choice", icon: <Radio size={16} />, group: "Choice" },
  { type: "checkbox", label: "Multi choice", icon: <CheckSquare size={16} />, group: "Choice" },
  { type: "file", label: "File upload", icon: <FileUp size={16} />, group: "Document" },
];

const fieldLabels: Record<FieldType, string> = {
  text: "Short text",
  textarea: "Long answer",
  number: "Number",
  email: "Email",
  phone: "Phone",
  select: "Dropdown",
  checkbox: "Multi choice",
  radio: "Single choice",
  file: "File upload",
};

export default function FormBuilderStudio() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingTemplateId = Number(searchParams.get("templateId") || 0) || null;
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("Untitled Client Form");
  const [formDesc, setFormDesc] = useState("Please complete the requested details and upload supporting documents.");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const selectedField = useMemo(
    () => fields.find((field) => field.id === selectedFieldId) || null,
    [fields, selectedFieldId]
  );

  useEffect(() => {
    const loadTemplate = async () => {
      if (!editingTemplateId) return;
      setLoadingTemplate(true);
      try {
        const tpl = await consultantApi.getTemplateById(editingTemplateId);
        setFormTitle(tpl.title);
        setFormDesc(tpl.description || "");
        const schema = tpl.schema_data as { fields?: FormField[] };
        const loadedFields = schema.fields || [];
        setFields(loadedFields);
        setSelectedFieldId(loadedFields[0]?.id ?? null);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load template");
      } finally {
        setLoadingTemplate(false);
      }
    };
    void loadTemplate();
  }, [editingTemplateId]);

  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: crypto.randomUUID(),
      type,
      label: fieldLabels[type],
      required: type === "file",
      options: ["select", "radio", "checkbox"].includes(type) ? ["Option 1", "Option 2"] : undefined,
    };
    setFields((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
  };

  const removeField = (id: string) => {
    setFields((prev) => {
      const next = prev.filter((field) => field.id !== id);
      if (selectedFieldId === id) setSelectedFieldId(next[0]?.id ?? null);
      return next;
    });
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields((prev) => prev.map((field) => (field.id === id ? { ...field, ...updates } : field)));
  };

  const addOption = (fieldId: string) => {
    setFields((prev) =>
      prev.map((field) =>
        field.id === fieldId
          ? { ...field, options: [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`] }
          : field
      )
    );
  };

  const updateOption = (fieldId: string, index: number, value: string) => {
    setFields((prev) =>
      prev.map((field) => {
        if (field.id !== fieldId || !field.options) return field;
        const options = [...field.options];
        options[index] = value;
        return { ...field, options };
      })
    );
  };

  const removeOption = (fieldId: string, index: number) => {
    setFields((prev) =>
      prev.map((field) =>
        field.id === fieldId && field.options
          ? { ...field, options: field.options.filter((_, i) => i !== index) }
          : field
      )
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setFields((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const handlePublish = async () => {
    if (!formTitle.trim()) {
      setError("Please give your form a title.");
      return;
    }
    if (fields.length === 0) {
      setError("Add at least one field before saving.");
      return;
    }

    setError("");
    setSaving(true);
    try {
      const payload = {
        title: formTitle,
        description: formDesc,
        schema_data: { fields },
      };
      if (editingTemplateId) {
        await consultantApi.updateTemplate(editingTemplateId, payload);
      } else {
        await consultantApi.createTemplate({ ...payload, is_global: false });
      }
      setSaved(true);
      setTimeout(() => router.push("/dashboard/forms"), 900);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save form");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6.5rem)] min-h-[680px] grid grid-cols-[220px_minmax(0,1fr)_320px] gap-4 overflow-hidden">
      <aside className="min-w-0 rounded-bubble-lg border border-border/70 bg-surface/85 overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-border/70">
          <p className="text-xs font-black uppercase tracking-wider text-foreground/45">Field Library</p>
          <h2 className="text-lg font-bold">Add fields</h2>
        </div>
        <div className="p-3 overflow-y-auto custom-scrollbar">
          {(["Input", "Choice", "Document"] as const).map((group) => (
            <div key={group} className="mb-5">
              <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-foreground/45">{group}</p>
              <div className="grid gap-2">
                {palette.filter((item) => item.group === group).map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => addField(item.type)}
                    className="h-10 px-3 rounded-bubble-sm border border-border bg-background/70 hover:border-primary hover:text-primary flex items-center gap-2 text-sm font-bold text-left"
                  >
                    <span className="w-6 h-6 rounded-bubble-sm bg-surface border border-border flex items-center justify-center">
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className="min-w-0 rounded-bubble-lg border border-border/70 bg-surface/85 overflow-hidden flex flex-col">
        <div className="h-14 px-4 border-b border-border/70 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-bold">{editingTemplateId ? "Edit Form Template" : "Form Studio"}</h1>
            <p className="text-xs text-foreground/55 font-medium">
              Name and email are collected automatically. Do not add them as fields.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {loadingTemplate && <span className="text-xs font-bold text-foreground/55">Loading...</span>}
            {error && <span className="text-xs font-bold text-red-500 max-w-64 truncate">{error}</span>}
            <BubbleButton onClick={handlePublish} disabled={saving || saved} className="gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
              {saved ? "Saved" : editingTemplateId ? "Update" : "Save"}
            </BubbleButton>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-background/45">
          <div className="max-w-4xl mx-auto p-4">
            <section className="mb-4 rounded-bubble-sm border border-border bg-surface p-4">
              <label className="text-[10px] font-black uppercase tracking-wider text-foreground/45">Template</label>
              <input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Form title"
                className="mt-1 w-full bg-transparent text-2xl font-black outline-none focus:text-primary"
              />
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Short instructions for the client"
                className="mt-1 w-full h-10 resize-none bg-transparent text-sm font-medium text-foreground/70 outline-none"
              />
            </section>

            {fields.length === 0 ? (
              <div className="h-80 rounded-bubble-lg border-2 border-dashed border-border bg-surface/70 flex flex-col items-center justify-center text-center">
                <Plus size={36} className="text-foreground/25 mb-3" />
                <p className="font-bold">Start with the field library</p>
                <p className="text-sm text-foreground/50">Add only the information you need to review the case.</p>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={fields.map((field) => field.id)} strategy={verticalListSortingStrategy}>
                  <div className="grid gap-2 pb-8">
                    {fields.map((field, index) => (
                      <SortableFieldCard
                        key={field.id}
                        field={field}
                        index={index}
                        selected={field.id === selectedFieldId}
                        onSelect={() => setSelectedFieldId(field.id)}
                        onRemove={() => removeField(field.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </main>

      <aside className="min-w-0 rounded-bubble-lg border border-border/70 bg-surface/85 overflow-hidden flex flex-col">
        <div className="h-14 px-4 border-b border-border/70 flex items-center gap-2">
          <PanelRightOpen size={17} className="text-primary" />
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-foreground/45">Inspector</p>
            <h2 className="text-sm font-bold">{selectedField ? "Field settings" : "No field selected"}</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {selectedField ? (
            <FieldInspector
              field={selectedField}
              onChange={(updates) => updateField(selectedField.id, updates)}
              onAddOption={() => addOption(selectedField.id)}
              onUpdateOption={(index, value) => updateOption(selectedField.id, index, value)}
              onRemoveOption={(index) => removeOption(selectedField.id, index)}
              onDelete={() => removeField(selectedField.id)}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-foreground/45">
              <AlertCircle size={28} className="mb-2" />
              <p className="text-sm font-semibold">Select a field to edit label, requirement, and options.</p>
            </div>
          )}
        </div>
      </aside>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 999px; }
      `}</style>
    </div>
  );
}

function SortableFieldCard({
  field,
  index,
  selected,
  onSelect,
  onRemove,
}: {
  field: FormField;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group rounded-bubble-sm border bg-surface p-3 flex items-start gap-3 transition-all ${
        selected ? "border-primary ring-2 ring-primary/15" : "border-border hover:border-primary/50"
      } ${isDragging ? "shadow-lg opacity-90" : "shadow-sm"}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="mt-1 w-8 h-8 rounded-bubble-sm border border-border bg-background flex items-center justify-center text-foreground/45 hover:text-primary cursor-grab active:cursor-grabbing"
        title="Drag to reorder"
      >
        <GripVertical size={17} />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-foreground/45">#{index + 1}</span>
          <span className="px-2 py-0.5 rounded-bubble-sm bg-background border border-border text-[10px] font-black uppercase text-foreground/50">
            {fieldLabels[field.type]}
          </span>
          {field.required && <span className="text-[10px] font-black text-primary">Required</span>}
        </div>
        <p className="mt-1 truncate font-bold">{field.label}</p>
        <p className="text-xs text-foreground/50">{previewText(field)}</p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="w-8 h-8 rounded-bubble-sm border border-transparent text-foreground/35 hover:text-red-500 hover:border-red-500/30"
        title="Delete field"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function FieldInspector({
  field,
  onChange,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
  onDelete,
}: {
  field: FormField;
  onChange: (updates: Partial<FormField>) => void;
  onAddOption: () => void;
  onUpdateOption: (index: number, value: string) => void;
  onRemoveOption: (index: number) => void;
  onDelete: () => void;
}) {
  const hasOptions = ["select", "radio", "checkbox"].includes(field.type);

  return (
    <div className="grid gap-4">
      <div>
        <label className="text-xs font-black uppercase tracking-wider text-foreground/45">Field label</label>
        <input
          value={field.label}
          onChange={(e) => onChange({ label: e.target.value })}
          className="mt-1 h-10 w-full px-3 rounded-bubble-sm border border-border bg-background font-semibold outline-none focus:border-primary"
        />
      </div>

      <label className="h-10 px-3 rounded-bubble-sm border border-border bg-background flex items-center justify-between">
        <span className="text-sm font-bold">Required</span>
        <input
          type="checkbox"
          checked={field.required}
          onChange={(e) => onChange({ required: e.target.checked })}
          className="w-4 h-4 accent-primary"
        />
      </label>

      {hasOptions && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-black uppercase tracking-wider text-foreground/45">Options</p>
            <button type="button" onClick={onAddOption} className="text-xs font-black text-primary inline-flex items-center gap-1">
              <PlusCircle size={14} /> Add
            </button>
          </div>
          <div className="grid gap-2">
            {(field.options || []).map((option, index) => (
              <div key={`${field.id}-${index}`} className="flex items-center gap-2">
                <input
                  value={option}
                  onChange={(e) => onUpdateOption(index, e.target.value)}
                  className="h-9 flex-1 min-w-0 px-3 rounded-bubble-sm border border-border bg-background text-sm font-semibold outline-none focus:border-primary"
                />
                <button type="button" onClick={() => onRemoveOption(index)} className="w-9 h-9 rounded-bubble-sm border border-border hover:border-red-500 hover:text-red-500">
                  <Trash2 size={14} className="mx-auto" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button type="button" onClick={onDelete} className="mt-2 h-10 rounded-bubble-sm border border-red-500/30 text-red-500 font-bold hover:bg-red-500/10">
        Delete field
      </button>
    </div>
  );
}

function previewText(field: FormField) {
  if (field.type === "file") return "Client uploads a supporting document.";
  if (["select", "radio", "checkbox"].includes(field.type)) return `${field.options?.length || 0} options configured.`;
  if (field.type === "textarea") return "Long text answer.";
  if (field.type === "number") return "Numeric answer.";
  if (field.type === "phone") return "Phone number answer.";
  if (field.type === "email") return "Email style answer.";
  return "Short text answer.";
}
