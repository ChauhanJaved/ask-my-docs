import React from "react";

interface JsonLdProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}

/**
 * Renders a type-safe JSON-LD structured data script element into the document head/body for SEO crawlers.
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Returns Organization Schema.org structure for FTChat brand entity
 */
export function getOrganizationJsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ftchat.io";
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "FTChat",
    url: baseUrl,
    logo: `${baseUrl}/icon-192.png`,
    sameAs: [
      "https://twitter.com/ftchat",
      "https://github.com/ChauhanJaved/ask-my-docs",
    ],
    description: "Instant AI support chatbot trained on your company documentation, FAQs, and files.",
  };
}

/**
 * Returns SoftwareApplication / WebApplication Schema.org structure
 */
export function getSoftwareAppJsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ftchat.io";
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "FTChat",
    operatingSystem: "All",
    applicationCategory: "BusinessApplication",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: "0",
      highPrice: "149",
      offerCount: "3",
      offers: [
        {
          "@type": "Offer",
          name: "Free Plan",
          price: "0",
          priceCurrency: "USD",
          description: "1 Chatbot, 3 Documents, 50 AI chats per month",
        },
        {
          "@type": "Offer",
          name: "Pro Plan",
          price: "49",
          priceCurrency: "USD",
          description: "3 Chatbots, 50 Documents, 1,000 AI chats per month, URL crawling",
        },
        {
          "@type": "Offer",
          name: "Business Plan",
          price: "149",
          priceCurrency: "USD",
          description: "Unlimited Chatbots, 500 Documents, 10,000 AI chats per month, API access",
        },
      ],
    },
    description: "Upload your PDFs, Markdown, and URLs to generate an embeddable AI support widget in minutes.",
    url: baseUrl,
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Returns FAQPage Schema.org structure for Search Engine Rich Snippets
 */
export function getFaqJsonLd(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export interface BreadcrumbItem {
  name: string;
  item: string;
}

/**
 * Returns BreadcrumbList Schema.org structure for navigational context
 */
export function getBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ftchat.io";
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.item.startsWith("http") ? crumb.item : `${baseUrl}${crumb.item}`,
    })),
  };
}
