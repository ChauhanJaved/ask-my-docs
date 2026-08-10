import React from "react";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { Breadcrumbs } from "@/components/marketing/Breadcrumbs";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-brand-500/20 selection:text-brand-900">
      <Header />
      <Breadcrumbs />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
    </div>
  );
}
