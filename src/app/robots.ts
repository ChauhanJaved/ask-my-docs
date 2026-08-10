import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ftchat.io";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/*", "/api/*", "/onboarding/*"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
