"use client";

import { useState } from "react";
import Link from "next/link";
import { BubbleCard } from "@/components/ui/BubbleCard";
import { BubbleButton } from "@/components/ui/BubbleButton";
import { authApi } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authApi.requestPasswordReset(email);
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <BubbleCard className="p-8">
          <h1 className="text-2xl font-bold mb-2">Forgot Password</h1>
          <p className="text-sm text-foreground/70 mb-6">Enter your email. If your account exists, we’ll send a reset link.</p>
          {done ? (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-green-600">If the email is registered, a reset link has been sent.</p>
              <Link href="/login"><BubbleButton className="w-full">Back to Login</BubbleButton></Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-11 px-4 rounded-bubble-sm border border-border bg-background focus:outline-none focus:border-primary"
              />
              <BubbleButton className="w-full" disabled={loading}>{loading ? "Sending..." : "Send Reset Link"}</BubbleButton>
            </form>
          )}
        </BubbleCard>
      </div>
    </div>
  );
}
