import type { Metadata } from "next";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { JsonLd, getBreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Reset Password — FTChat",
  description:
    "Reset your password for your FTChat account to regain access to your AI chatbot workspace.",
  alternates: {
    canonical: "/reset-password",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function ResetPasswordPage() {
  const breadcrumbs = [
    { name: "Home", item: "/" },
    { name: "Reset Password", item: "/reset-password" },
  ];

  return (
    <>
      <JsonLd data={getBreadcrumbJsonLd(breadcrumbs)} />
      <ResetPasswordForm />
    </>
  );
}
