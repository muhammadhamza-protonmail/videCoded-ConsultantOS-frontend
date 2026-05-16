"use client";

import { useEffect, useState } from "react";
import { BubbleCard } from "@/components/ui/BubbleCard";
import { BubbleButton } from "@/components/ui/BubbleButton";
import { Users, FileText, CheckCircle, Activity, ClipboardList, ShieldCheck, TrendingUp, Clock, Loader2 } from "lucide-react";
import { useRole } from "@/components/RoleContext";
import { motion } from "framer-motion";
import Link from "next/link";
import { adminApi, consultantApi, clientApi, User, FormTemplate, Assignment } from "@/lib/api";

export default function DashboardOverviewPage() {
  const { role } = useRole();
  const [data, setData] = useState<{
    users: User[];
    templates: FormTemplate[];
    assignments: Assignment[];
  }>({ users: [], templates: [], assignments: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (role === "admin") {
          const [u, t, a] = await Promise.all([
            adminApi.getUsers(), 
            adminApi.getTemplates(),
            consultantApi.getAssignments() // Admin can see all through this for now
          ]);
          setData({ users: u, templates: t, assignments: a });
        } else if (role === "consultant") {
          const [c, t, a] = await Promise.all([
            consultantApi.getClients(), 
            consultantApi.getTemplates(),
            consultantApi.getAssignments()
          ]);
          setData({ users: c, templates: t, assignments: a });
        } else if (role === "client") {
          const a = await clientApi.getMyAssignments();
          setData({ users: [], templates: [], assignments: a });
        }
      } catch (e) {
        console.error("Dashboard fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [role]);

  const getStats = () => {
    if (role === "admin" || role === "consultant") {
      const isConsultant = role === "consultant";
      const submissions = data.assignments.filter(a => a.status === "submitted").length;
      const totalClients = isConsultant ? data.users.length : data.users.filter(u => u.role === "client").length;
      
      return [
        { title: isConsultant ? "My Clients" : "Total Users", value: totalClients, icon: <Users className="w-5 h-5 text-blue-500" />, trend: isConsultant ? "Assigned to you" : "On platform", border: "border-t-blue-500" },
        { title: "Active Forms",    value: data.templates.length,   icon: <FileText className="w-5 h-5 text-primary" />, trend: "Studio templates", border: "border-t-primary" },
        { title: "Responses In",    value: submissions, icon: <CheckCircle className="w-5 h-5 text-green-500" />, trend: "New submissions",     border: "border-t-green-500" },
        { title: "Pending Forms",  value: data.assignments.filter(a => a.status === "not_started").length,   icon: <Clock className="w-5 h-5 text-yellow-500" />, trend: "Waiting on clients", border: "border-t-yellow-500" },
      ];
    } else {
      const pending = data.assignments.filter(a => a.status === "not_started").length;
      const completed = data.assignments.filter(a => ["submitted", "reviewed"].includes(a.status)).length;
      const inProgress = data.assignments.filter(a => a.status === "in_progress").length;
      return [
        { title: "Forms Assigned",  value: data.assignments.length, icon: <ClipboardList className="w-5 h-5 text-blue-500" />, trend: `${pending} need action`, border: "border-t-blue-500" },
        { title: "Completed",       value: completed,   icon: <CheckCircle className="w-5 h-5 text-green-500" />,  trend: "Nice work!",    border: "border-t-green-500" },
        { title: "In Progress",     value: inProgress,   icon: <Activity className="w-5 h-5 text-primary" />,      trend: "Finish them",     border: "border-t-primary" },
        { title: "Overdue",         value: "0",   icon: <Clock className="w-5 h-5 text-red-500" />,          trend: "On schedule",      border: "border-t-red-500" },
      ];
    }
  };

  // Derived Activity Feed
  const recentActivity = data.assignments
    .map(a => {
      if (a.status === "submitted") {
        return { label: `${a.client?.username} submitted ${a.template?.title}`, time: a.submitted_at ? "Recent" : "Just now", dot: "bg-green-500" };
      }
      return { label: `Assigned ${a.template?.title} to ${a.client?.username}`, time: "Today", dot: "bg-blue-500" };
    })
    .slice(0, 5);

  const stats = getStats();
  // Safe config access...
  const config = {
    admin: {
      greeting: "Admin Control Center",
      subtitle: "Full platform visibility — users, forms, and all active workflows.",
      quickActions: [
        { label: "Manage Users",    href: "/dashboard/users",        variant: "primary" as const },
        { label: "View All Forms",  href: "/dashboard/forms",        variant: "secondary" as const },
      ],
    },
    consultant: {
      greeting: "Your Workspace",
      subtitle: "Track your clients, manage form templates, and review incoming responses.",
      quickActions: [
        { label: "View Clients",    href: "/dashboard/clients",      variant: "primary" as const },
        { label: "Open Form Studio",href: "/dashboard/forms/builder",variant: "secondary" as const },
      ],
    },
    client: {
      greeting: "Your Dashboard",
      subtitle: "Forms assigned to you by your consultant are listed here.",
      quickActions: [
        { label: "View My Forms",   href: "/dashboard/my-forms",     variant: "primary" as const },
      ],
    },
  }[role] || { greeting: "Welcome", subtitle: "", quickActions: [] };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">{config.greeting}</h1>
        <p className="text-foreground/60">{config.subtitle}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <BubbleCard hoverEffect className={`p-5 border-t-[6px] ${stat.border} flex flex-col gap-4 h-full relative overflow-hidden`}>
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-foreground/70 text-sm">{stat.title}</h4>
                <div className="p-2 bg-background rounded-bubble-sm border-[3px] border-border shadow-sm">
                  {stat.icon}
                </div>
              </div>
              <div>
                <p className="text-4xl font-black">
                  {loading ? <Loader2 className="w-8 h-8 animate-spin text-foreground/20" /> : stat.value}
                </p>
                <p className="text-xs text-foreground/50 mt-1 font-bold">{stat.trend}</p>
              </div>
            </BubbleCard>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-bold text-foreground/60">Quick Actions:</span>
        {config.quickActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <BubbleButton variant={action.variant} size="sm">{action.label}</BubbleButton>
          </Link>
        ))}
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
        {/* Activity Feed */}
        <BubbleCard className="col-span-1 lg:col-span-2 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-lg flex items-center gap-2"><TrendingUp size={18} className="text-primary" /> Recent Activity</h3>
          </div>
          <div className="flex flex-col gap-3">
            {recentActivity.length === 0 ? (
              <p className="py-10 text-center text-foreground/20 font-bold italic">No recent activity detected.</p>
            ) : recentActivity.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.07 }}
                className="flex items-center gap-4 p-3 rounded-bubble-sm border border-border bg-background hover:border-primary/35 transition-colors"
              >
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.dot}`} />
                <p className="flex-1 text-sm font-medium">{item.label}</p>
                <span className="text-xs font-bold text-foreground/50 shrink-0">{item.time}</span>
              </motion.div>
            ))}
          </div>
        </BubbleCard>
        {/* Role-specific hint panel */}
        <BubbleCard className="p-6 flex flex-col gap-4 border-t-[6px] border-t-primary">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={18} className="text-primary" />
            <h3 className="font-bold text-lg">Your Role</h3>
          </div>
          <div className="text-sm text-foreground/60 font-medium leading-relaxed space-y-3">
            {role === "admin" && <>
              <p>As <strong className="text-foreground">Super Admin</strong>, you have full read and write access to all users, forms, and assignments across the entire platform.</p>
              <p>Use the <strong className="text-foreground">All Users</strong> panel to manage account roles and the Status board to monitor consultant performance.</p>
            </>}
            {role === "consultant" && <>
              <p>As a <strong className="text-foreground">Consultant</strong>, you can create dynamic JSON forms via the Studio and assign them directly to your clients.</p>
              <p>Clients receive a focused view with only their assigned forms — they won't see anything else.</p>
            </>}
            {role === "client" && <>
              <p>As a <strong className="text-foreground">Client</strong>, your consultant has set up forms for you to fill out at your own pace.</p>
              <p>Check <strong className="text-foreground">My Forms</strong> for the list of items assigned to you and their status.</p>
            </>}
          </div>
          <div className="mt-auto pt-4 border-t-[3px] border-border">
            <Link href={config.quickActions[0].href}>
              <BubbleButton className="w-full">{config.quickActions[0].label}</BubbleButton>
            </Link>
          </div>
        </BubbleCard>
      </div>
    </div>
  );
}
