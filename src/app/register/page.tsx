"use client";

import { BubbleCard } from "@/components/ui/BubbleCard";
import { BubbleButton } from "@/components/ui/BubbleButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Layers, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const [formData, setFormData] = useState({ username: "", email: "", password: "", role: "client" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(formData);
      // AuthContext auto-logs in and redirects to /dashboard
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-background overflow-hidden py-12">
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-lava-500/10 rounded-full blur-[100px] -z-10 translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute top-6 right-6 z-20"><ThemeToggle /></div>

      <div className="w-full max-w-md animate-[float_6s_ease-in-out_infinite]" style={{ animationDelay: "-1s" }}>
        <BubbleCard className="p-8 w-full">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-tr from-lava-600 to-lava-400 rounded-bubble flex items-center justify-center shadow-lg shadow-lava-500/30 mb-4">
              <Layers className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Create Account</h1>
            <p className="text-foreground/60 text-sm mt-1">Join the ConsultantOS platform</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-bubble-sm border-[3px] border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-bold mb-4">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-foreground/80">Account Type</label>
              <select
                className="h-11 px-4 rounded-bubble-sm border-[3px] border-border bg-background focus:outline-none focus:border-lava-500 transition-colors font-bold cursor-pointer"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="client">Client / Student</option>
                <option value="consultant">Consultant</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-foreground/80">Username</label>
              <input type="text" required
                className="h-11 px-4 rounded-bubble-sm border-[3px] border-border bg-background focus:outline-none focus:border-lava-500 transition-colors font-medium"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-foreground/80">Email</label>
              <input type="email" required
                className="h-11 px-4 rounded-bubble-sm border-[3px] border-border bg-background focus:outline-none focus:border-lava-500 transition-colors font-medium"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-foreground/80">Password</label>
              <input type="password" required minLength={8}
                className="h-11 px-4 rounded-bubble-sm border-[3px] border-border bg-background focus:outline-none focus:border-lava-500 transition-colors font-medium"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <BubbleButton type="submit" className="w-full mt-4" disabled={loading}>
              {loading ? <><Loader2 size={18} className="animate-spin mr-2" />Creating Account…</> : "Create Account"}
            </BubbleButton>
          </form>

          <p className="text-center text-sm text-foreground/60 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-lava-500 font-bold hover:underline">Sign In</Link>
          </p>
        </BubbleCard>
      </div>
    </div>
  );
}
