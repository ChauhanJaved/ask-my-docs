import type { Metadata } from "next";
import { SignupForm } from "./SignupForm";
import { JsonLd, getBreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Create Account — FTChat AI Support Assistant",
  description:
    "Sign up free for FTChat. Upload files, crawl docs, and build your custom AI support chatbot in minutes.",
  alternates: {
    canonical: "/signup",
  },
  openGraph: {
    title: "Create Account — FTChat AI Support Assistant",
    description:
      "Sign up free for FTChat. Upload files, crawl docs, and build your custom AI support chatbot.",
    url: "/signup",
    siteName: "FTChat",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SignupPage() {
  const breadcrumbs = [
    { name: "Home", item: "/" },
    { name: "Sign Up", item: "/signup" },
  ];

  return (
    <>
      <JsonLd data={getBreadcrumbJsonLd(breadcrumbs)} />
      <SignupForm />
    </>
  );
}
