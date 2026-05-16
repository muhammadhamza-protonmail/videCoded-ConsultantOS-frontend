"use client";

import { useEffect, useState } from "react";
import { BubbleCard } from "@/components/ui/BubbleCard";
import { BubbleButton } from "@/components/ui/BubbleButton";
import { Search, UserPlus, ShieldCheck, User, BriefcaseBusiness, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { adminApi, User as UserType } from "@/lib/api";

const ROLE_STYLE: Record<string, string> = {
  admin:      "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/30",
  consultant: "text-lava-600 dark:text-lava-400 bg-lava-500/10 border-lava-500/30",
  client:     "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30",
};
const ROLE_ICON: Record<string, React.ReactNode> = {
  admin:      <ShieldCheck size={13} />,
  consultant: <BriefcaseBusiness size={13} />,
  client:     <User size={13} />,
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi.getUsers()
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (userId: number) => {
    setToggling(userId);
    try {
      const updated = await adminApi.toggleUserStatus(userId);
      setUsers((prev) => prev.map((u) => u.id === userId ? updated : u));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setToggling(null);
    }
  };

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    admin: users.filter((u) => u.role === "admin").length,
    consultant: users.filter((u) => u.role === "consultant").length,
    client: users.filter((u) => u.role === "client").length,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Users</h1>
          <p className="text-foreground/60">Full visibility into every account. Admin-only.</p>
        </div>
        <BubbleButton className="gap-2 shrink-0"><UserPlus size={18} /> Invite User</BubbleButton>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Admins",      value: counts.admin,      color: "border-t-purple-500" },
          { label: "Consultants", value: counts.consultant, color: "border-t-lava-500" },
          { label: "Clients",     value: counts.client,     color: "border-t-blue-500" },
        ].map((s) => (
          <BubbleCard key={s.label} className={`p-4 border-t-[6px] ${s.color}`}>
            <span className="text-2xl font-black">{s.value}</span>
            <p className="text-sm font-bold text-foreground/60 mt-1">{s.label}</p>
          </BubbleCard>
        ))}
      </div>

      <BubbleCard className="p-6">
        <div className="relative w-full max-w-sm mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-bubble-sm border-[3px] border-border bg-background focus:outline-none focus:border-lava-500 transition-colors font-medium"
          />
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12 gap-3 text-foreground/50">
            <Loader2 className="animate-spin" /> Loading users…
          </div>
        )}
        {error && <p className="text-red-500 font-bold py-8 text-center">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-[3px] border-border">
                  {["Username", "Email", "Role", "Status", "Joined", "Actions"].map((h) => (
                    <th key={h} className="pb-3 font-bold text-foreground/70 text-sm">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, i) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-border/50 hover:bg-background/50 transition-colors"
                  >
                    <td className="py-4 font-bold">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-bubble-sm bg-gradient-to-tr from-lava-600 to-lava-400 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                          {user.username[0].toUpperCase()}
                        </div>
                        {user.username}
                      </div>
                    </td>
                    <td className="py-4 text-foreground/70 font-medium">{user.email}</td>
                    <td className="py-4">
                      <span className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-bubble-sm text-xs font-black border-[2px] ${ROLE_STYLE[user.role]}`}>
                        {ROLE_ICON[user.role]} {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`px-2.5 py-1 rounded-bubble-sm text-xs font-black border-[2px] ${user.is_active ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30" : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"}`}>
                        {user.is_active ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="py-4 text-foreground/60 font-medium text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4">
                      <BubbleButton
                        variant={user.is_active ? "outline" : "secondary"}
                        size="sm"
                        disabled={toggling === user.id}
                        onClick={() => handleToggle(user.id)}
                        className={user.is_active ? "border-red-500 text-red-500 hover:bg-red-500/10" : ""}
                      >
                        {toggling === user.id
                          ? <Loader2 size={14} className="animate-spin" />
                          : user.is_active ? "Suspend" : "Activate"}
                      </BubbleButton>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </BubbleCard>
    </div>
  );
}
