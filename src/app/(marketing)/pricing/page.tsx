import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import {
  JsonLd,
  getSoftwareAppJsonLd,
  getBreadcrumbJsonLd,
} from "@/components/seo/JsonLd";

// Enforce Static Site Generation (SSG)
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Pricing Plans & Tiers",
  description:
    "Simple, transparent pricing for AI support chatbots. Start free with 5 docs & 100 messages/month, or scale up with Pro & Enterprise features.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing Plans & Tiers — FTChat AI Support Assistant",
    description:
      "Simple, transparent pricing for AI support chatbots. Choose from Free, Pro ($49/mo), and Enterprise tiers.",
    url: "/pricing",
    siteName: "FTChat",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FTChat Pricing Plans",
        type: "image/png",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@ftchat",
    creator: "@ftchat",
    title: "Pricing Plans & Tiers — FTChat",
    description: "Simple, transparent pricing for AI support chatbots.",
    images: ["/twitter-image.png"],
  },
};

export default function PricingPage() {
  const breadcrumbs = [
    { name: "Home", item: "/" },
    { name: "Pricing", item: "/pricing" },
  ];

  return (
    <>
      {/* Schema.org Structured Data Injection */}
      <JsonLd data={getBreadcrumbJsonLd(breadcrumbs)} />
      <JsonLd data={getSoftwareAppJsonLd()} />

      <div className="py-16 px-6 container mx-auto flex-1">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-3xl md:text-5xl font-bold font-display text-neutral-950 dark:text-white">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-300">
            Choose the perfect plan for your business support needs.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white dark:bg-neutral-900 p-8 rounded-lg border border-neutral-200 dark:border-neutral-800 flex flex-col transition-colors">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Free</h2>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">For testing and personal side projects.</p>
            <div className="mt-6 flex items-baseline">
              <span className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">$0</span>
              <span className="ml-1 text-sm font-semibold text-neutral-500 dark:text-neutral-400">/month</span>
            </div>
            <ul className="mt-8 space-y-4 text-sm text-neutral-600 dark:text-neutral-300 flex-1">
              <li className="flex items-center">✓ 1 Chatbot Bot</li>
              <li className="flex items-center">✓ Up to 3 Documents (max 5MB each)</li>
              <li className="flex items-center">✓ 50 AI Chats / month</li>
              <li className="flex items-center">✓ Standard RAG logic</li>
            </ul>
            <Link href="/signup" className="mt-8">
              <Button variant="outline" className="w-full">
                Sign Up Free
              </Button>
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-white dark:bg-neutral-900 p-8 rounded-lg border-2 border-brand-500 shadow-md flex flex-col relative transition-colors">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Popular
            </span>
            <h2 className="text-lg font-bold text-brand-600 dark:text-brand-400">Pro</h2>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">For growing businesses needing active support.</p>
            <div className="mt-6 flex items-baseline">
              <span className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">$49</span>
              <span className="ml-1 text-sm font-semibold text-neutral-500 dark:text-neutral-400">/month</span>
            </div>
            <ul className="mt-8 space-y-4 text-sm text-neutral-600 dark:text-neutral-300 flex-1">
              <li className="flex items-center">✓ 3 Chatbot Bots</li>
              <li className="flex items-center">✓ Up to 50 Documents (max 10MB each)</li>
              <li className="flex items-center">✓ 1,000 AI Chats / month</li>
              <li className="flex items-center">✓ Custom Theme Options & Chat Widgets</li>
              <li className="flex items-center">✓ URL Scraping & Crawling</li>
            </ul>
            <Link href="/signup" className="mt-8">
              <Button className="w-full bg-brand-600 hover:bg-brand-700 text-white">
                Start Pro Trial
              </Button>
            </Link>
          </div>

          {/* Business Plan */}
          <div className="bg-white dark:bg-neutral-900 p-8 rounded-lg border border-neutral-200 dark:border-neutral-800 flex flex-col transition-colors">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Business</h2>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">For high-traffic operations and enterprise.</p>
            <div className="mt-6 flex items-baseline">
              <span className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">$149</span>
              <span className="ml-1 text-sm font-semibold text-neutral-500 dark:text-neutral-400">/month</span>
            </div>
            <ul className="mt-8 space-y-4 text-sm text-neutral-600 dark:text-neutral-300 flex-1">
              <li className="flex items-center">✓ Unlimited Chatbot Bots</li>
              <li className="flex items-center">✓ Up to 500 Documents (max 20MB each)</li>
              <li className="flex items-center">✓ 10,000 AI Chats / month</li>
              <li className="flex items-center">✓ Custom System Prompt Overrides</li>
              <li className="flex items-center">✓ Priority support and API access</li>
            </ul>
            <Link href="/signup" className="mt-8">
              <Button variant="outline" className="w-full">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
