"use client";

import { BubbleCard } from "@/components/ui/BubbleCard";
import { BubbleButton } from "@/components/ui/BubbleButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Layers, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    console.log("[Login] Starting handleLogin for:", formData.username);
    try {
      await login(formData.username, formData.password);
      console.log("[Login] Login function completed successfully");
      // AuthContext handles redirect
    } catch (err: unknown) {
      console.error("[Login] Login failed with error:", err);
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      console.log("[Login] Resetting loading state");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-background overflow-hidden">
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-lava-500/10 rounded-full blur-[100px] -z-10 translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-lava-500/5 rounded-full blur-[80px] -z-10 -translate-x-1/2 translate-y-1/2 pointer-events-none" />
      <div className="absolute top-6 right-6 z-20"><ThemeToggle /></div>

      <div className="w-full max-w-md animate-[float_6s_ease-in-out_infinite]">
        <BubbleCard className="p-8 w-full">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-tr from-lava-600 to-lava-400 rounded-bubble flex items-center justify-center shadow-lg shadow-lava-500/30 mb-4">
              <Layers className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome Back</h1>
            <p className="text-foreground/60 text-sm mt-1">Sign in to ConsultantOS</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-bubble-sm border-[3px] border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-bold mb-4">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-foreground/80">Username</label>
              <input
                type="text" required
                className="h-11 px-4 rounded-bubble-sm border-[3px] border-border bg-background focus:outline-none focus:border-lava-500 transition-colors font-medium"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-foreground/80">Password</label>
              <input
                type="password" required
                className="h-11 px-4 rounded-bubble-sm border-[3px] border-border bg-background focus:outline-none focus:border-lava-500 transition-colors font-medium"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <BubbleButton type="submit" className="w-full mt-4" disabled={loading}>
              {loading ? <><Loader2 size={18} className="animate-spin mr-2" />Signing In…</> : "Sign In"}
            </BubbleButton>
          </form>

          <p className="text-center text-sm text-foreground/60 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-lava-500 font-bold hover:underline">Register here</Link>
          </p>
          <p className="text-center text-sm text-foreground/60 mt-2">
            <Link href="/forgot-password" className="text-primary font-semibold hover:underline">Forgot password?</Link>
          </p>
        </BubbleCard>
      </div>
    </div>
  );
}
