"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Bell, CheckCircle2, Loader2, PaintBucket, Save, Shield, Trash2, UserRound } from "lucide-react";
import { BubbleCard } from "@/components/ui/BubbleCard";
import { BubbleButton } from "@/components/ui/BubbleButton";
import { useAuth } from "@/components/AuthContext";
import { authApi, ProfileUpdate } from "@/lib/api";
import { avatarInitial, displayName, inferTimezone, inputToTags, profileImageUrl, tagsToInput } from "@/lib/profile";

type Tab = "profile" | "notifications" | "security" | "appearance" | "account";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState<Tab>("profile");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [identityInput, setIdentityInput] = useState("");
  const [audienceInput, setAudienceInput] = useState("");
  const [form, setForm] = useState<ProfileUpdate>({});

  useEffect(() => {
    if (!user) return;
    setForm({
      email: user.email,
      display_name: user.display_name || user.username,
      first_name: user.first_name || user.username,
      last_name: user.last_name || "",
      phone_number: user.phone_number || "",
      country: user.country || "",
      city: user.city || "",
      timezone: user.timezone || "",
      bio: user.bio || "",
      qualification: user.qualification || "",
      experience_years: user.experience_years ?? 0,
    });
    setIdentityInput(tagsToInput(user.identity_keywords));
    setAudienceInput(tagsToInput(user.audience_keywords));
  }, [user]);

  const updateField = (key: keyof ProfileUpdate, value: string | number) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "country" || key === "city") {
        next.timezone = inferTimezone(String(next.country || ""), String(next.city || ""));
      }
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
      setSuccess("Avatar updated.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Avatar upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const payload: ProfileUpdate = {
        ...form,
        identity_keywords: inputToTags(identityInput),
        audience_keywords: inputToTags(audienceInput),
      };
      if (password) payload.password = password;
      await authApi.updateMe(payload);
      await refreshUser();
      setPassword("");
      setConfirmPassword("");
      setSuccess("Profile updated successfully.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update profile");
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
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-primary/10 border-[3px] border-border flex items-center justify-center text-2xl font-black text-primary">
                    {profileImageUrl(user) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profileImageUrl(user)} alt={displayName(user)} className="w-full h-full object-cover" />
                    ) : (
                      avatarInitial(user)
                    )}
                  </div>
                  <label className="inline-flex">
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => void handleAvatarUpload(e.target.files?.[0])} />
                    <span className="h-10 px-4 rounded-bubble-sm border-[3px] border-border bg-background font-bold flex items-center">
                      Upload Profile Image
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Display Name" value={String(form.display_name || "")} onChange={(v) => updateField("display_name", v)} />
                  <Field label="Username" value={user?.username || ""} readOnly />
                  <Field label="First Name" value={String(form.first_name || "")} onChange={(v) => updateField("first_name", v)} />
                  <Field label="Last Name" value={String(form.last_name || "")} onChange={(v) => updateField("last_name", v)} />
                  <Field label="Email" type="email" value={String(form.email || "")} onChange={(v) => updateField("email", v)} />
                  <Field label="Phone Number" value={String(form.phone_number || "")} onChange={(v) => updateField("phone_number", v)} />
                  <Field label="Country" value={String(form.country || "")} onChange={(v) => updateField("country", v)} />
                  <Field label="City" value={String(form.city || "")} onChange={(v) => updateField("city", v)} />
                  <Field label="Timezone" value={String(form.timezone || "")} readOnly />
                  <Field label="Experience Years" type="number" value={String(form.experience_years ?? 0)} onChange={(v) => updateField("experience_years", Number(v || 0))} />
                  <Field label="Qualification" className="md:col-span-2" value={String(form.qualification || "")} onChange={(v) => updateField("qualification", v)} />
                  <TextArea label="Bio" value={String(form.bio || "")} onChange={(v) => updateField("bio", v)} />
                  <Field label="Identity Keywords" className="md:col-span-2" value={identityInput} onChange={setIdentityInput} />
                  <Field label={user?.role === "consultant" ? "Who You Serve" : "What You Need"} className="md:col-span-2" value={audienceInput} onChange={setAudienceInput} />
                </div>
              </>
            )}

            {tab === "security" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

function Field({ label, value, onChange, type = "text", readOnly = false, className = "" }: { label: string; value: string; onChange?: (value: string) => void; type?: string; readOnly?: boolean; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-sm font-bold text-foreground/80">{label}</label>
      <input type={type} readOnly={readOnly} value={value} onChange={(e) => onChange?.(e.target.value)} className={`h-11 px-4 rounded-bubble-sm border-[3px] border-border bg-background focus:outline-none focus:border-primary transition-colors font-medium ${readOnly ? "opacity-70" : ""}`} />
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
