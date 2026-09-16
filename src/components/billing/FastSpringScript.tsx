"use client";

import Script from "next/script";
import { FASTSPRING_STOREFRONT_URL } from "@/lib/plans";

declare global {
  interface Window {
    fastspring?: {
      builder: {
        push: (data: Record<string, unknown>, callback?: () => void) => void;
        reset: () => void;
        checkout: (productId?: string) => void;
      };
    };
  }
}

export function FastSpringScript() {
  // Extract storefront path from URL e.g. "frameworkteam.onfastspring.com"
  const storefrontPath = FASTSPRING_STOREFRONT_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <Script
      id="fsl"
      src="https://d1f8f9xcsvx3ha.cloudfront.net/sbl/0.8.0/fastspring-builder.min.js"
      data-storefront={storefrontPath}
      data-debug="false"
      strategy="afterInteractive"
    />
  );
}

/**
 * Triggers FastSpring popup checkout for a product with the current organization ID in tags.
 */
export function openFastSpringCheckout(productId: string, organizationId: string) {
  if (typeof window === "undefined" || !window.fastspring) {
    console.warn("FastSpring SBL script not loaded yet. Redirecting to storefront.");
    window.open(`${FASTSPRING_STOREFRONT_URL}/${productId}?tags[organization_id]=${organizationId}`, "_blank");
    return;
  }

  // Push product & organization tag to FastSpring builder
  window.fastspring.builder.push({
    products: [{ path: productId, quantity: 1 }],
    tags: {
      organization_id: organizationId,
    },
  });
}
