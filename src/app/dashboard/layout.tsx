"use client";

import { ReactNode } from "react";
import {
  Layers, Users, FileText, Settings, LogOut,
  LayoutDashboard, UserCog, ClipboardList, ChevronDown, MessageSquare
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { BubbleButton } from "@/components/ui/BubbleButton";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole, Role } from "@/components/RoleContext";
import { useAuth } from "@/components/AuthContext";
import { motion } from "framer-motion";

// ─── Nav definitions per role ─────────────────────────────────────────────────
const NAV_ITEMS: Record<Role, { href: string; icon: ReactNode; label: string }[]> = {
  admin: [
    { href: "/dashboard", icon: <LayoutDashboard size={20} />, label: "Overview" },
    { href: "/dashboard/users", icon: <UserCog size={20} />, label: "All Users" },
    { href: "/dashboard/clients", icon: <Users size={20} />, label: "Clients" },
    { href: "/dashboard/documents", icon: <FileText size={20} />, label: "Documents" },
    { href: "/dashboard/forms", icon: <FileText size={20} />, label: "Form Templates" },
    { href: "/dashboard/submissions", icon: <ClipboardList size={20} />, label: "Submissions" },
    { href: "/dashboard/settings", icon: <Settings size={20} />, label: "Settings" },
  ],
  consultant: [
    { href: "/dashboard", icon: <LayoutDashboard size={20} />, label: "Overview" },
    { href: "/dashboard/clients", icon: <Users size={20} />, label: "Clients" },
    { href: "/dashboard/documents", icon: <FileText size={20} />, label: "Documents" },
    { href: "/dashboard/forms", icon: <FileText size={20} />, label: "Form Templates" },
    { href: "/dashboard/submissions", icon: <ClipboardList size={20} />, label: "Submissions" },
    { href: "/dashboard/messages", icon: <MessageSquare size={20} />, label: "Messages" },
    { href: "/dashboard/settings", icon: <Settings size={20} />, label: "Settings" },
  ],
  client: [
    { href: "/dashboard", icon: <LayoutDashboard size={20} />, label: "Overview" },
    { href: "/dashboard/consultants", icon: <Users size={20} />, label: "Consultants" },
    { href: "/dashboard/my-forms", icon: <ClipboardList size={20} />, label: "My Forms" },
    { href: "/dashboard/messages", icon: <MessageSquare size={20} />, label: "Messages" },
    { href: "/dashboard/settings", icon: <Settings size={20} />, label: "Settings" },
  ],
};

const ROLE_LABELS: Record<Role, { label: string; badge: string; color: string }> = {
  admin: { label: "Super Admin", badge: "ADMIN", color: "text-primary bg-primary/10 border-primary/30 dark:text-[#f2eee6]" },
  consultant: { label: "Consultant", badge: "PRO", color: "text-[#800000] bg-[#800000]/10 border-[#800000]/35 dark:text-[#ffd9d9] dark:bg-[#800000]/22 dark:border-[#800000]/55" },
  client: { label: "Client", badge: "CLIENT", color: "text-[#2E8B57] bg-[#2E8B57]/10 border-[#2E8B57]/35 dark:text-[#d5f4e0] dark:bg-[#2E8B57]/22 dark:border-[#2E8B57]/55" },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  const { role, setRole } = useRole();
  const { user, logout } = useAuth();
  const navItems = NAV_ITEMS[role];
  const roleInfo = ROLE_LABELS[role];

  const pageLabel = pathname === "/dashboard"
    ? "Overview"
    : pathname.split("/").pop()?.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) ?? "Dashboard";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-surface/80 backdrop-blur-md hidden md:flex flex-col z-20 shadow-sm">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-border/70">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-tr from-primary to-[#2E8B57] rounded-bubble flex items-center justify-center shadow-md">
              <Layers className="text-white w-4 h-4" />
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">OS<span className="text-primary">Workspace</span></span>
          </Link>
        </div>

        {/* Role badge */}
        <div className="px-4 pt-4">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-bubble-sm border font-bold text-sm ${roleInfo.color}`}>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md border ${roleInfo.color}`}>{roleInfo.badge}</span>
            {roleInfo.label}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
          {navItems.map((item) => {
            const active = item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className="block">
                <motion.button
                  whileHover={{ x: 4 }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-bubble-sm font-bold transition-all duration-200 ${
                    active
                      ? "bg-primary/12 text-primary dark:text-[#d7ddff] border border-primary/35"
                      : "text-foreground hover:bg-background/65 border border-transparent hover:border-border hover:text-primary dark:hover:text-[#d7ddff]"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </motion.button>
              </Link>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t border-border/70 bg-background/40">
          <BubbleButton
            variant="ghost"
            onClick={logout}
            className="w-full justify-start text-foreground hover:text-[#800000] dark:hover:text-[#ffb2b2] hover:bg-[#800000]/10 border-transparent hover:border-[#800000]/20"
          >
            <LogOut className="w-5 h-5 mr-3" /> Sign Out
          </BubbleButton>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-lava-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

        {/* Header */}
        <header className="h-16 border-b border-border/70 bg-background/78 backdrop-blur-md flex items-center justify-between px-8 z-10 sticky top-0">
          <h2 className="font-bold text-lg text-foreground">{pageLabel}</h2>

          <div className="flex items-center gap-3">
            {/* Role Switcher (Dev Tool) */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-2 rounded-bubble-sm border border-border bg-surface text-sm font-bold hover:border-primary/40 transition-colors">
                <span className="text-muted">Preview as:</span>
                <span className="text-primary capitalize">{role}</span>
                <ChevronDown size={14} className="text-muted" />
              </button>
              <div className="absolute right-0 top-full mt-2 w-44 bg-surface border border-border rounded-bubble-sm shadow-xl overflow-hidden hidden group-hover:block z-50">
                {(["admin", "consultant", "client"] as Role[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`w-full flex items-center gap-2 px-4 py-3 text-sm font-bold hover:bg-background transition-colors ${role === r ? "text-primary" : "text-foreground"}`}
                  >
                    {ROLE_LABELS[r].label}
                  </button>
                ))}
              </div>
            </div>

            <ThemeToggle />

            <Link href="/dashboard/settings">
              <div className="w-10 h-10 rounded-bubble-sm bg-gradient-to-tr from-primary to-[#2E8B57] border border-primary/40 flex items-center justify-center text-white font-bold shadow-sm cursor-pointer hover:brightness-110 transition-all">
                {user?.username?.[0]?.toUpperCase() ?? role[0].toUpperCase()}
              </div>
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 relative z-0">
          {children}
        </div>
      </main>
    </div>
  );
}
