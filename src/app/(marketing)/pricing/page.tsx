import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import {
  JsonLd,
  getSoftwareAppJsonLd,
  getBreadcrumbJsonLd,
} from "@/components/seo/JsonLd";
import { PLAN_DEFINITIONS } from "@/lib/plans";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Pricing Plans & Tiers",
  description:
    "Simple, transparent pricing for AI support chatbots. Start free with 100 messages/month, or scale up with Starter ($29/mo), Pro ($79/mo), & Business ($249/mo).",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing Plans & Tiers — FTChat AI Support Assistant",
    description:
      "Simple, transparent pricing for AI support chatbots. Choose from Free, Starter ($29/mo), Pro ($79/mo), and Business ($249/mo) tiers.",
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
      <JsonLd data={getBreadcrumbJsonLd(breadcrumbs)} />
      <JsonLd data={getSoftwareAppJsonLd()} />

      <div className="py-16 px-6 container mx-auto flex-1">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-3xl md:text-5xl font-bold font-display text-neutral-950 dark:text-white">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-300">
            Turn your knowledge base into an embeddable AI widget. Scale seamlessly as your traffic grows.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* Free Tier */}
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between transition-colors">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white font-display">
                {PLAN_DEFINITIONS.free.name}
              </h2>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 min-h-[32px]">
                {PLAN_DEFINITIONS.free.description}
              </p>
              <div className="mt-4 flex items-baseline">
                <span className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-display">
                  $0
                </span>
                <span className="ml-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  /month
                </span>
              </div>
              <ul className="mt-6 space-y-3 text-xs text-neutral-600 dark:text-neutral-300">
                {PLAN_DEFINITIONS.free.featureHighlights.map((item, i) => (
                  <li key={i} className="flex items-center space-x-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/signup" className="mt-8">
              <Button variant="outline" className="w-full text-xs">
                Get Started Free
              </Button>
            </Link>
          </div>

          {/* Starter Tier */}
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between transition-colors">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white font-display">
                {PLAN_DEFINITIONS.starter.name}
              </h2>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 min-h-[32px]">
                {PLAN_DEFINITIONS.starter.description}
              </p>
              <div className="mt-4 flex items-baseline">
                <span className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-display">
                  ${PLAN_DEFINITIONS.starter.priceMonthly}
                </span>
                <span className="ml-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  /month
                </span>
              </div>
              <ul className="mt-6 space-y-3 text-xs text-neutral-600 dark:text-neutral-300">
                {PLAN_DEFINITIONS.starter.featureHighlights.map((item, i) => (
                  <li key={i} className="flex items-center space-x-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/signup" className="mt-8">
              <Button variant="outline" className="w-full text-xs">
                Start Starter Plan
              </Button>
            </Link>
          </div>

          {/* Pro Tier (Featured) */}
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border-2 border-brand-500 shadow-lg flex flex-col justify-between relative transition-colors">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
              {PLAN_DEFINITIONS.pro.badge}
            </span>
            <div>
              <h2 className="text-lg font-bold text-brand-600 dark:text-brand-400 font-display">
                {PLAN_DEFINITIONS.pro.name}
              </h2>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 min-h-[32px]">
                {PLAN_DEFINITIONS.pro.description}
              </p>
              <div className="mt-4 flex items-baseline">
                <span className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-display">
                  ${PLAN_DEFINITIONS.pro.priceMonthly}
                </span>
                <span className="ml-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  /month
                </span>
              </div>
              <ul className="mt-6 space-y-3 text-xs text-neutral-600 dark:text-neutral-300">
                {PLAN_DEFINITIONS.pro.featureHighlights.map((item, i) => (
                  <li key={i} className="flex items-center space-x-2">
                    <span className="text-brand-500 font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/signup" className="mt-8">
              <Button className="w-full bg-brand-600 hover:bg-brand-700 text-white text-xs shadow-md">
                Start Pro Plan
              </Button>
            </Link>
          </div>

          {/* Business Tier */}
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between transition-colors">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white font-display">
                {PLAN_DEFINITIONS.business.name}
              </h2>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 min-h-[32px]">
                {PLAN_DEFINITIONS.business.description}
              </p>
              <div className="mt-4 flex items-baseline">
                <span className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-display">
                  ${PLAN_DEFINITIONS.business.priceMonthly}
                </span>
                <span className="ml-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  /month
                </span>
              </div>
              <ul className="mt-6 space-y-3 text-xs text-neutral-600 dark:text-neutral-300">
                {PLAN_DEFINITIONS.business.featureHighlights.map((item, i) => (
                  <li key={i} className="flex items-center space-x-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/signup" className="mt-8">
              <Button variant="outline" className="w-full text-xs">
                Get Business Plan
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
