"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BubbleCard } from "@/components/ui/BubbleCard";
import { BubbleButton } from "@/components/ui/BubbleButton";
import { authApi } from "@/lib/api";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { setError("Invalid reset link."); return; }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPassword !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    setError("");
    try {
      await authApi.confirmPasswordReset(token, newPassword);
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <BubbleCard className="p-8">
          <h1 className="text-2xl font-bold mb-2">Set New Password</h1>
          <p className="text-sm text-foreground/70 mb-6">Create a new password for your account.</p>
          {done ? (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-green-600">Password updated successfully.</p>
              <Link href="/login"><BubbleButton className="w-full">Go to Login</BubbleButton></Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
              <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" className="w-full h-11 px-4 rounded-bubble-sm border border-border bg-background focus:outline-none focus:border-primary" />
              <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" className="w-full h-11 px-4 rounded-bubble-sm border border-border bg-background focus:outline-none focus:border-primary" />
              <BubbleButton className="w-full" disabled={loading}>{loading ? "Updating..." : "Update Password"}</BubbleButton>
            </form>
          )}
        </BubbleCard>
      </div>
    </div>
  );
}
