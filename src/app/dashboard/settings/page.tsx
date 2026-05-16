"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Bell, CheckCircle2, Loader2, PaintBucket, Plus, Save, Shield, Trash2, UserRound, X } from "lucide-react";
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

  const addQualification = () => {
    setQualifications((prev) => [...prev, { degree_type: "Bachelor", title: "", institute: "" }]);
  };

  const updateQualification = (index: number, key: keyof QualificationItem, value: string) => {
    setQualifications((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  };

  const removeQualification = (index: number) => {
    setQualifications((prev) => prev.filter((_, i) => i !== index));
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
                  <div className="w-24 h-24 rounded-bubble-lg overflow-hidden bg-primary/10 border-[3px] border-border flex items-center justify-center text-3xl font-black text-primary shrink-0">
                    {profileImageUrl(user) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profileImageUrl(user)} alt={displayName(user)} className="w-full h-full object-cover" />
                    ) : (
                      avatarInitial(user)
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-2xl font-bold truncate">{displayName(user)}</h2>
                    <p className="text-sm text-foreground/45 font-bold">@{user?.username}</p>
                    <label className="inline-flex mt-3">
                      <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => void handleAvatarUpload(e.target.files?.[0])} />
                      <span className="h-10 px-4 rounded-bubble-sm border-[3px] border-border bg-background font-bold flex items-center">
                        Upload Image
                      </span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Name" placeholder="Muhammad Saleh" value={String(form.display_name || "")} onChange={(v) => updateField("display_name", v)} />
                  <Field label="Phone Number" value={String(form.phone_number || "")} onChange={(v) => updateField("phone_number", v)} />
                  <SelectField label="Country" value={String(form.country || "Pakistan")} options={Object.keys(COUNTRIES)} onChange={(v) => updateField("country", v)} />
                  <SelectField label="City" value={String(form.city || "Lahore")} options={selectedCities} onChange={(v) => updateField("city", v)} />
                  <Field label="Timezone" value={String(form.timezone || "")} readOnly />
                  <Field label="Experience Years" type="number" value={String(form.experience_years ?? 0)} onChange={(v) => updateField("experience_years", Number(v || 0))} />
                  <TextArea label="Bio" value={String(form.bio || "")} onChange={(v) => updateField("bio", v)} />
                </div>

                <SectionTitle title="Qualifications" actionLabel="Add Qualification" onAction={addQualification} />
                <div className="flex flex-col gap-3">
                  {qualifications.length === 0 && <p className="text-sm text-foreground/50 font-medium">No qualifications added yet.</p>}
                  {qualifications.map((q, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-[160px_1fr_1fr_40px] gap-3 items-end rounded-bubble-sm border-[2px] border-border p-3 bg-background/50">
                      <SelectField label="Degree" value={q.degree_type} options={degreeTypes} onChange={(v) => updateQualification(index, "degree_type", v)} />
                      <Field label="Title" value={q.title} onChange={(v) => updateQualification(index, "title", v)} />
                      <Field label="Institute" value={q.institute} onChange={(v) => updateQualification(index, "institute", v)} />
                      <button type="button" onClick={() => removeQualification(index)} className="h-11 rounded-bubble-sm border-[2px] border-border hover:border-red-500 hover:text-red-500 flex items-center justify-center">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <TagInput label="Identity Keywords" value={identityInput} onChange={setIdentityInput} tags={identityTags} />
                <TagInput label={user?.role === "consultant" ? "Who You Serve" : "What You Need"} value={audienceInput} onChange={setAudienceInput} tags={audienceTags} />
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

function TagInput({ label, value, onChange, tags }: { label: string; value: string; onChange: (value: string) => void; tags: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <Field label={`${label} (${tags.length}/20)`} value={value} onChange={onChange} placeholder="Add keywords separated by commas" />
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="px-2.5 py-1 rounded-bubble-sm border-[2px] border-primary/20 bg-primary/10 text-primary text-xs font-black">
              {tag}
            </span>
          ))}
        </div>
      )}
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
