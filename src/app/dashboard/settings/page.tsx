"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Bell, CheckCircle2, Loader2, PaintBucket, Pencil, Plus, Save, Shield, Trash2, UserRound, X } from "lucide-react";
import { BubbleCard } from "@/components/ui/BubbleCard";
import { BubbleButton } from "@/components/ui/BubbleButton";
import { useAuth } from "@/components/AuthContext";
import { authApi, ProfileUpdate, QualificationItem } from "@/lib/api";
import { avatarInitial, COUNTRIES, displayName, inferTimezone, inputToTags, profileImageUrl, tagsToInput } from "@/lib/profile";

type Tab = "profile" | "notifications" | "security" | "appearance" | "account";

const degreeTypes = ["Bachelor", "Master", "PHD", "Diploma", "Certificate"];

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState<Tab>("profile");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [identityInput, setIdentityInput] = useState("");
  const [audienceInput, setAudienceInput] = useState("");
  const [form, setForm] = useState<ProfileUpdate>({});
  const [qualifications, setQualifications] = useState<QualificationItem[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftQualification, setDraftQualification] = useState<QualificationItem | null>(null);
  const [tagEditor, setTagEditor] = useState<null | "identity" | "audience">(null);
  const [tagDraft, setTagDraft] = useState("");

  useEffect(() => {
    if (!user) return;
    const country = user.country || "Pakistan";
    const city = user.city || "Lahore";
    setEmail(user.email);
    setForm({
      display_name: user.display_name || user.username,
      phone_number: user.phone_number || "",
      country,
      city,
      timezone: user.timezone || inferTimezone(country, city),
      bio: user.bio || "",
      experience_years: user.experience_years ?? 0,
    });
    setQualifications(user.qualifications?.length ? user.qualifications : []);
    setIdentityInput(tagsToInput(user.identity_keywords));
    setAudienceInput(tagsToInput(user.audience_keywords));
    setDraftName(user.display_name || user.username);
  }, [user]);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(""), 3500);
    return () => window.clearTimeout(timer);
  }, [success]);

  const selectedCities = useMemo(() => COUNTRIES[String(form.country || "Pakistan")] || [], [form.country]);
  const identityTags = inputToTags(identityInput);
  const audienceTags = inputToTags(audienceInput);

  const updateField = (key: keyof ProfileUpdate, value: string | number) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "country") {
        const firstCity = COUNTRIES[String(value)]?.[0] || "";
        next.city = firstCity;
        next.timezone = inferTimezone(String(value), firstCity);
      }
      if (key === "city") next.timezone = inferTimezone(String(next.country || ""), String(value));
      return next;
    });
  };

  const handleAvatarUpload = async (file?: File) => {
    if (!file) return;
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await authApi.uploadAvatar(file);
      await refreshUser();
      setSuccess("Profile image updated.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Avatar upload failed");
    } finally {
      setLoading(false);
    }
  };

  const removeQualification = (index: number) => {
    setQualifications((prev) => prev.filter((_, i) => i !== index));
  };

  const saveDraftName = () => {
    const nextName = draftName.trim() || user?.username || "";
    updateField("display_name", nextName);
    setDraftName(nextName);
    setIsEditingName(false);
  };

  const saveDraftQualification = () => {
    if (!draftQualification?.title.trim() || !draftQualification.institute.trim()) return;
    setQualifications((prev) => [...prev, draftQualification]);
    setDraftQualification(null);
  };

  const addTag = () => {
    if (!tagEditor) return;
    const current = tagEditor === "identity" ? identityTags : audienceTags;
    const nextTags = [...current, ...inputToTags(tagDraft)]
      .filter((tag, index, arr) => arr.findIndex((t) => t.toLowerCase() === tag.toLowerCase()) === index)
      .slice(0, 20);
    if (tagEditor === "identity") setIdentityInput(tagsToInput(nextTags));
    else setAudienceInput(tagsToInput(nextTags));
    setTagDraft("");
  };

  const removeTag = (kind: "identity" | "audience", tag: string) => {
    const current = kind === "identity" ? identityTags : audienceTags;
    const next = current.filter((item) => item !== tag);
    if (kind === "identity") setIdentityInput(tagsToInput(next));
    else setAudienceInput(tagsToInput(next));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (tab === "profile" && (!form.country || !form.city)) {
      setError("Country and city are required.");
      return;
    }
    if (tab === "security" && password && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const payload: ProfileUpdate = {};
      if (tab === "profile") {
        Object.assign(payload, {
          ...form,
          qualifications: qualifications.filter((q) => q.degree_type && q.title.trim() && q.institute.trim()),
          identity_keywords: identityTags,
          audience_keywords: audienceTags,
        });
      }
      if (tab === "security") {
        payload.email = email;
        if (password) payload.password = password;
      }
      await authApi.updateMe(payload);
      await refreshUser();
      setPassword("");
      setConfirmPassword("");
      setSuccess(tab === "security" ? "Security settings updated." : "Profile updated successfully.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-foreground/60">Manage your profile, security, notifications, appearance, and account controls.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        <div className="flex md:flex-col gap-2 overflow-x-auto">
          <TabButton active={tab === "profile"} icon={<UserRound size={18} />} label="Profile" onClick={() => setTab("profile")} />
          <TabButton active={tab === "notifications"} icon={<Bell size={18} />} label="Notifications" onClick={() => setTab("notifications")} />
          <TabButton active={tab === "security"} icon={<Shield size={18} />} label="Security" onClick={() => setTab("security")} />
          <TabButton active={tab === "appearance"} icon={<PaintBucket size={18} />} label="Appearance" onClick={() => setTab("appearance")} />
          <TabButton active={tab === "account"} icon={<Trash2 size={18} />} label="Account" onClick={() => setTab("account")} />
        </div>

        <BubbleCard className="p-6">
          {error && <Notice kind="error" message={error} />}
          {success && <Notice kind="success" message={success} />}

          <form onSubmit={handleSave} className="flex flex-col gap-6">
            {tab === "profile" && (
              <>
                <div className="flex items-center gap-5">
                  <label className="relative group w-24 h-24 rounded-bubble-lg overflow-hidden bg-primary/10 border-[3px] border-border flex items-center justify-center text-3xl font-black text-primary shrink-0">
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => void handleAvatarUpload(e.target.files?.[0])} />
                    {profileImageUrl(user) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profileImageUrl(user)} alt={displayName(user)} className="w-full h-full object-cover" />
                    ) : (
                      avatarInitial(user)
                    )}
                    <span className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Pencil size={20} />
                    </span>
                  </label>
                  <div className="min-w-0">
                    {isEditingName ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={draftName}
                          placeholder="Muhammad Saleh"
                          onChange={(e) => setDraftName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveDraftName();
                            if (e.key === "Escape") setIsEditingName(false);
                          }}
                          className="h-10 px-3 rounded-bubble-sm border-[3px] border-border bg-background text-xl font-bold focus:outline-none focus:border-primary"
                        />
                        <button type="button" onClick={saveDraftName} className="h-10 px-3 rounded-bubble-sm border-[2px] border-primary text-primary font-bold">Save</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setIsEditingName(true)} className="group flex items-center gap-2 text-left">
                        <span className="text-2xl font-bold truncate">{String(form.display_name || displayName(user))}</span>
                        <Pencil size={16} className="text-foreground/35 group-hover:text-primary" />
                      </button>
                    )}
                    <p className="text-sm text-foreground/45 font-bold">@{user?.username}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Phone Number" value={String(form.phone_number || "")} onChange={(v) => updateField("phone_number", v)} />
                  <SelectField label="Country" value={String(form.country || "Pakistan")} options={Object.keys(COUNTRIES)} onChange={(v) => updateField("country", v)} />
                  <SelectField label="City" value={String(form.city || "Lahore")} options={selectedCities} onChange={(v) => updateField("city", v)} />
                  <Field label="Timezone" value={String(form.timezone || "")} readOnly />
                  <Field label="Experience Years" type="number" value={String(form.experience_years ?? 0)} onChange={(v) => updateField("experience_years", Number(v || 0))} />
                  <TextArea label="Bio" value={String(form.bio || "")} onChange={(v) => updateField("bio", v)} />
                </div>

                <SectionTitle title="Qualifications" actionLabel="Add Qualification" onAction={() => setDraftQualification({ degree_type: "Bachelor", title: "", institute: "" })} />
                <div className="flex flex-col gap-3">
                  {qualifications.length === 0 && <p className="text-sm text-foreground/50 font-medium">No qualifications added yet.</p>}
                  {qualifications.map((q, index) => (
                    <div key={`${q.degree_type}-${q.title}-${index}`} className="flex items-center justify-between gap-3 rounded-bubble-sm border-[2px] border-border p-3 bg-background/50">
                      <div>
                        <p className="font-bold">{q.degree_type} - {q.title}</p>
                        <p className="text-xs text-foreground/50 font-semibold">{q.institute}</p>
                      </div>
                      <button type="button" onClick={() => removeQualification(index)} className="h-9 w-9 rounded-bubble-sm border-[2px] border-border hover:border-red-500 hover:text-red-500 flex items-center justify-center">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {draftQualification && (
                    <div className="grid grid-cols-1 md:grid-cols-[150px_1fr_1fr_auto_auto] gap-3 items-end rounded-bubble-sm border-[2px] border-primary/30 p-3 bg-primary/5">
                      <SelectField label="Degree" value={draftQualification.degree_type} options={degreeTypes} onChange={(v) => setDraftQualification((prev) => prev ? { ...prev, degree_type: v } : prev)} />
                      <Field label="Title" value={draftQualification.title} onChange={(v) => setDraftQualification((prev) => prev ? { ...prev, title: v } : prev)} />
                      <Field label="Institute" value={draftQualification.institute} onChange={(v) => setDraftQualification((prev) => prev ? { ...prev, institute: v } : prev)} />
                      <BubbleButton type="button" size="sm" onClick={saveDraftQualification}>Add</BubbleButton>
                      <button type="button" onClick={() => setDraftQualification(null)} className="h-10 w-10 rounded-bubble-sm border-[2px] border-border hover:border-red-500 hover:text-red-500 flex items-center justify-center">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <TagSection label="Identity Keywords" tags={identityTags} onAdd={() => setTagEditor("identity")} onRemove={(tag) => removeTag("identity", tag)} />
                <TagSection label={user?.role === "consultant" ? "Who You Serve" : "What You Need"} tags={audienceTags} onAdd={() => setTagEditor("audience")} onRemove={(tag) => removeTag("audience", tag)} />
              </>
            )}

            {tab === "security" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Email Address" type="email" value={email} onChange={setEmail} />
                <div />
                <Field label="New Password" type="password" value={password} onChange={setPassword} />
                <Field label="Confirm Password" type="password" value={confirmPassword} onChange={setConfirmPassword} />
              </div>
            )}

            {tab === "notifications" && <Placeholder title="Notifications" text="Notification preferences will connect to the existing notification system in the next phase." />}
            {tab === "appearance" && <Placeholder title="Appearance" text="Theme settings are currently handled by the existing light/dark toggle." />}
            {tab === "account" && <Placeholder title="Account" text="Account deletion request workflow will be added after profile and messaging foundations are stable." />}

            {(tab === "profile" || tab === "security") && (
              <div className="border-t-[3px] border-border pt-5 flex justify-end">
                <BubbleButton type="submit" disabled={loading} className="gap-2">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Save Changes
                </BubbleButton>
              </div>
            )}
          </form>
        </BubbleCard>
      </div>
      {tagEditor && (
        <div className="fixed inset-0 z-50 bg-background/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-bubble-lg border-[3px] border-border bg-surface p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{tagEditor === "identity" ? "Identity Keywords" : user?.role === "consultant" ? "Who You Serve" : "What You Need"}</h2>
              <button type="button" onClick={() => { setTagEditor(null); setTagDraft(""); }} className="h-9 w-9 rounded-bubble-sm border-[2px] border-border flex items-center justify-center hover:text-red-500 hover:border-red-500">
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {(tagEditor === "identity" ? identityTags : audienceTags).map((tag) => (
                <span key={tag} className="group px-2.5 py-1 rounded-bubble-sm border-[2px] border-primary/20 bg-primary/10 text-primary text-xs font-black inline-flex items-center gap-1.5">
                  {tag}
                  <button type="button" onClick={() => removeTag(tagEditor, tag)} className="hidden group-hover:inline-flex">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="keyword, another keyword"
                className="h-11 flex-1 px-4 rounded-bubble-sm border-[3px] border-border bg-background focus:outline-none focus:border-primary font-medium"
              />
              <BubbleButton type="button" onClick={addTag}>Add</BubbleButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-bubble-sm font-bold border-[3px] text-left whitespace-nowrap ${active ? "text-primary bg-primary/10 border-primary/30" : "text-foreground/70 hover:bg-surface border-transparent hover:border-border"}`}>
      {icon} {label}
    </button>
  );
}

function Field({ label, value, onChange, type = "text", readOnly = false, className = "", placeholder = "" }: { label: string; value: string; onChange?: (value: string) => void; type?: string; readOnly?: boolean; className?: string; placeholder?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-sm font-bold text-foreground/80">{label}</label>
      <input type={type} readOnly={readOnly} value={value} placeholder={placeholder} onChange={(e) => onChange?.(e.target.value)} className={`h-11 px-4 rounded-bubble-sm border-[3px] border-border bg-background focus:outline-none focus:border-primary transition-colors font-medium ${readOnly ? "opacity-70" : ""}`} />
    </div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-bold text-foreground/80">{label}</label>
      <select required value={value} onChange={(e) => onChange(e.target.value)} className="h-11 px-4 rounded-bubble-sm border-[3px] border-border bg-background focus:outline-none focus:border-primary transition-colors font-medium">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="md:col-span-2 flex flex-col gap-1.5">
      <label className="text-sm font-bold text-foreground/80">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} maxLength={300} className="min-h-24 p-4 rounded-bubble-sm border-[3px] border-border bg-background focus:outline-none focus:border-primary transition-colors font-medium" />
    </div>
  );
}

function SectionTitle({ title, actionLabel, onAction }: { title: string; actionLabel: string; onAction: () => void }) {
  return (
    <div className="flex items-center justify-between border-t-[3px] border-border pt-5">
      <h2 className="text-xl font-bold">{title}</h2>
      <BubbleButton type="button" variant="secondary" size="sm" onClick={onAction} className="gap-2">
        <Plus size={15} /> {actionLabel}
      </BubbleButton>
    </div>
  );
}

function TagSection({ label, tags, onAdd, onRemove }: { label: string; tags: string[]; onAdd: () => void; onRemove: (tag: string) => void }) {
  return (
    <div className="flex flex-col gap-3 border-t-[3px] border-border pt-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{label} <span className="text-sm text-foreground/40">({tags.length}/20)</span></h2>
        <BubbleButton type="button" variant="secondary" size="sm" onClick={onAdd} className="gap-2">
          <Plus size={15} /> Add Tag
        </BubbleButton>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="group px-2.5 py-1 rounded-bubble-sm border-[2px] border-primary/20 bg-primary/10 text-primary text-xs font-black inline-flex items-center gap-1.5">
              {tag}
              <button type="button" onClick={() => onRemove(tag)} className="hidden group-hover:inline-flex">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      {tags.length === 0 && <p className="text-sm text-foreground/50 font-medium">No tags yet.</p>}
    </div>
  );
}

function Notice({ kind, message }: { kind: "error" | "success"; message: string }) {
  const isError = kind === "error";
  return (
    <div className={`mb-5 flex items-center gap-2 px-4 py-3 rounded-bubble-sm border-[3px] text-sm font-bold ${isError ? "border-red-500/30 bg-red-500/10 text-red-600" : "border-green-500/30 bg-green-500/10 text-green-600"}`}>
      {isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />} {message}
    </div>
  );
}

function Placeholder({ title, text }: { title: string; text: string }) {
  return (
    <div className="min-h-48 flex flex-col justify-center">
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-foreground/60">{text}</p>
    </div>
  );
}
