import { BubbleButton } from "@/components/ui/BubbleButton";
import { BubbleCard } from "@/components/ui/BubbleCard";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ArrowRight, Layers, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-500/10 rounded-full blur-[120px] -z-10 translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary-700/10 rounded-full blur-[100px] -z-10 -translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <header className="flex items-center justify-between px-8 py-6 w-full max-w-7xl mx-auto z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-primary-600 to-primary-400 rounded-bubble flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Layers className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight">ConsultantOs</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login" tabIndex={-1}>
            <BubbleButton variant="ghost">Sign In</BubbleButton>
          </Link>
          <Link href="/register" tabIndex={-1}>
            <BubbleButton>Get Started</BubbleButton>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 z-10 pb-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/50 backdrop-blur-md border border-border shadow-sm mb-8 animate-[float_6s_ease-in-out_infinite]">
          <span className="flex h-2 w-2 rounded-full bg-primary-500" />
          <span className="text-sm font-medium">v2.0 is now live in production</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 text-foreground max-w-4xl leading-[1.1]">
          Consulting <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">Elevated.</span>
        </h1>
        
        <p className="text-xl text-foreground/60 max-w-2xl mb-10">
          Manage clients, dynamic JSON-driven forms, and project assignments in one beautiful, modular workspace designed specifically for top-tier consultancies.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center max-w-md">
          <Link href="/register" className="w-full">
            <BubbleButton size="lg" className="w-full text-lg gap-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 shadow-xl shadow-primary-500/20">
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </BubbleButton>
          </Link>
          <Link href="/login" className="w-full">
            <BubbleButton variant="secondary" size="lg" className="w-full text-lg">
              View Live Demo
            </BubbleButton>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 w-full max-w-5xl mt-24 text-left">
          <BubbleCard hoverEffect className="p-8">
            <div className="w-12 h-12 bg-primary-500/10 rounded-bubble-sm flex items-center justify-center mb-6 ring-1 ring-primary-500/20">
              <Zap className="w-6 h-6 text-primary-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Dynamic Forms</h3>
            <p className="text-foreground/60">Build JSON-driven interactive forms seamlessly via our drag-and-drop studio.</p>
          </BubbleCard>
          
          <BubbleCard hoverEffect className="p-8 relative overflow-hidden ring-1 ring-primary-500/30 shadow-lg shadow-primary-500/10">
            <div className="absolute top-0 right-0 p-8 w-full h-full bg-gradient-to-br from-primary-500/10 to-transparent pointer-events-none" />
            <div className="w-12 h-12 bg-primary-500/10 rounded-bubble-sm flex items-center justify-center mb-6 ring-1 ring-primary-500/20">
              <Layers className="w-6 h-6 text-primary-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Workspace Isolation</h3>
            <p className="text-foreground/60">Clients see only what they need to. Consultants manage entirely via views.</p>
          </BubbleCard>

          <BubbleCard hoverEffect className="p-8">
            <div className="w-12 h-12 bg-primary-500/10 rounded-bubble-sm flex items-center justify-center mb-6 ring-1 ring-primary-500/20">
              <ShieldCheck className="w-6 h-6 text-primary-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Bank-grade Security</h3>
            <p className="text-foreground/60">JWT authenticated with strict FastAPI-based role guards protecting routes.</p>
          </BubbleCard>
        </div>
      </main>
    </div>
  );
}
