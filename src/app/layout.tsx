import type { Metadata } from "next";
import { Geist, Manrope } from "next/font/google";
import "./globals.css";
import { AuthRoleBridgeClient } from "@/components/AuthRoleBridge";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ConsultantOS — Consultancy Management Platform",
  description: "Manage clients, forms, and assignments in one premium workspace.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthRoleBridgeClient>{children}</AuthRoleBridgeClient>
      </body>
    </html>
  );
}
