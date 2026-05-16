"use client";

import { useState, useEffect } from "react";
import { BubbleCard } from "@/components/ui/BubbleCard";
import { BubbleButton } from "@/components/ui/BubbleButton";
import { User, Bell, Shield, PaintBucket, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { authApi } from "@/lib/api";

export default function SettingsPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setEmail(user.email);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (password && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const updateData: { email?: string; password?: string } = {};
      if (email !== user?.email) updateData.email = email;
      if (password) updateData.password = password;

      if (Object.keys(updateData).length === 0) {
        setLoading(false);
        return;
      }

      await authApi.updateMe(updateData);

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-foreground/60">Configure your workspace themes, profile preferences, and account security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 flex flex-col gap-2">
          <button className="flex items-center gap-3 px-4 py-3 rounded-bubble-sm font-bold text-lava-600 bg-lava-500/10 border-[3px] border-lava-500/30 text-left">
            <User size={18} /> Profile
          </button>
          <button className="flex items-center gap-3 px-4 py-3 rounded-bubble-sm font-bold text-foreground/70 hover:bg-surface border-[3px] border-transparent hover:border-border text-left">
            <Bell size={18} /> Notifications
          </button>
          <button className="flex items-center gap-3 px-4 py-3 rounded-bubble-sm font-bold text-foreground/70 hover:bg-surface border-[3px] border-transparent hover:border-border text-left">
            <Shield size={18} /> Security
          </button>
          <button className="flex items-center gap-3 px-4 py-3 rounded-bubble-sm font-bold text-foreground/70 hover:bg-surface border-[3px] border-transparent hover:border-border text-left">
            <PaintBucket size={18} /> Appearance
          </button>
        </div>

        <div className="md:col-span-3 flex flex-col gap-6">
          <BubbleCard className="p-8">
            <h2 className="text-xl font-bold mb-6">Profile Information</h2>
            
            <form onSubmit={handleSave} className="flex flex-col gap-6">
              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-bubble-sm border-[3px] border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-bold">
                  <AlertCircle size={16} /> {error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-bubble-sm border-[3px] border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-bold">
                  <CheckCircle2 size={16} /> Profile updated successfully!
                </div>
              )}

              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-lava-600 to-lava-400 flex items-center justify-center text-white text-3xl font-bold shadow-md">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
                <BubbleButton type="button" variant="secondary" size="sm">Change Avatar</BubbleButton>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-foreground/80">Username</label>
                  <input type="text" readOnly value={user?.username || ""} className="h-11 px-4 rounded-bubble-sm border-[3px] border-border bg-background/50 font-medium opacity-70 outline-none" />
                </div>
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-foreground/80">Email Address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 px-4 rounded-bubble-sm border-[3px] border-border bg-background focus:outline-none focus:border-lava-500 transition-colors font-medium" 
                  />
                </div>
                <div className="col-span-1 flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-foreground/80">New Password</label>
                  <input 
                    type="password" 
                    placeholder="Leave blank to keep current"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 px-4 rounded-bubble-sm border-[3px] border-border bg-background focus:outline-none focus:border-lava-500 transition-colors font-medium" 
                  />
                </div>
                <div className="col-span-1 flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-foreground/80">Confirm Password</label>
                  <input 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 px-4 rounded-bubble-sm border-[3px] border-border bg-background focus:outline-none focus:border-lava-500 transition-colors font-medium" 
                  />
                </div>
              </div>

              <div className="border-t-[3px] border-border pt-6 mt-2 flex justify-end">
                <BubbleButton type="submit" disabled={loading} className="gap-2 shrink-0">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Save Changes
                </BubbleButton>
              </div>
            </form>
          </BubbleCard>
        </div>
      </div>
    </div>
  );
}
