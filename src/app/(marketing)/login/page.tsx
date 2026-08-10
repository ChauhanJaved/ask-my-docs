import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import { JsonLd, getBreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Log In — FTChat AI Support Dashboard",
  description:
    "Sign in to your FTChat organization workspace to manage document ingestion, customization, analytics, and embedding.",
  alternates: {
    canonical: "/login",
  },
  openGraph: {
    title: "Log In — FTChat AI Support Dashboard",
    description: "Sign in to your FTChat organization workspace.",
    url: "/login",
    siteName: "FTChat",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LoginPage() {
  const breadcrumbs = [
    { name: "Home", item: "/" },
    { name: "Log In", item: "/login" },
  ];

  return (
    <>
      <JsonLd data={getBreadcrumbJsonLd(breadcrumbs)} />
      <LoginForm />
    </>
  );
}
