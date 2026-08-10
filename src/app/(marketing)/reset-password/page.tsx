import type { Metadata } from "next";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { JsonLd, getBreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Reset Password",
  description:
    "Reset your password for your FTChat account to regain access to your AI chatbot workspace.",
  alternates: {
    canonical: "/reset-password",
  },
  openGraph: {
    title: "Reset Password — FTChat",
    description: "Reset your password for your FTChat account.",
    url: "/reset-password",
    siteName: "FTChat",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FTChat Reset Password",
        type: "image/png",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@ftchat",
    creator: "@ftchat",
    title: "Reset Password — FTChat",
    description: "Reset your password for your FTChat account.",
    images: ["/twitter-image.png"],
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
