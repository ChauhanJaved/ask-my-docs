import type { Metadata } from "next";
import { LandingPageClient } from "./LandingPageClient";
import {
  JsonLd,
  getOrganizationJsonLd,
  getSoftwareAppJsonLd,
  getFaqJsonLd,
} from "@/components/seo/JsonLd";

// Enforce Static Site Generation (SSG) for instant edge loading & optimal SEO
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "FTChat — Turn Your Docs into an Instant AI Support Agent",
  description:
    "Upload PDFs, Markdown, TXT files or crawl documentation URLs to generate an embeddable, customizable RAG AI customer support chat widget in minutes.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "FTChat — Instant AI Support Chatbot for Your Website",
    description:
      "Upload docs or crawl website URLs. Deliver accurate, cited RAG AI customer support with seamless human handoff.",
    url: "/",
    siteName: "FTChat",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FTChat — Instant AI Support Chatbot from Your Docs",
    description:
      "Upload docs or crawl website URLs. Deliver accurate, cited RAG AI customer support.",
  },
};

const LANDING_FAQS = [
  {
    question: "Which file formats are supported for document ingestion?",
    answer:
      "FTChat supports PDF files, Markdown (.md), plaintext (.txt), and Word documents (.docx). Additionally, we provide an automatic URL web crawler that scraps, cleans, and segments content directly from public documentation links.",
  },
  {
    question: "Can I customize the look and feel of the widget?",
    answer:
      "Yes! On our Pro and Enterprise plans, you can fully match the chatbot widget with your brand. Customize the accent color, launcher icon, header text, welcome prompt, and avatar to make the assistant blend seamlessly into your product.",
  },
  {
    question: "How does the 'human-in-the-loop' handoff work?",
    answer:
      "If the AI widget encounters a question it cannot answer with high confidence (or if the user requests human support), it displays a contact form. This triggers a ticket that goes straight to your team dashboard or hooks into your support email address.",
  },
  {
    question: "Is my customer data secure?",
    answer:
      "Absolutely. Security is central to FTChat. All document contents are stored inside isolated Supabase databases with Row Level Security (RLS) policies. We do not use your proprietary documents to train public foundational LLM models.",
  },
  {
    question: "What happens if I exceed my monthly message limits?",
    answer:
      "If you approach your limit, we'll notify you. We offer soft limits so your service isn't abruptly cut off, giving you a grace period to upgrade. Additional message packages can also be purchased on demand.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Schema.org Structured Data Injection for Search Engine Crawlers */}
      <JsonLd data={getOrganizationJsonLd()} />
      <JsonLd data={getSoftwareAppJsonLd()} />
      <JsonLd data={getFaqJsonLd(LANDING_FAQS)} />

      {/* Interactive SSG Landing Page Client Shell */}
      <LandingPageClient />
    </>
  );
}
