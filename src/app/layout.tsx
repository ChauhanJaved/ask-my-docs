import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { siteConfig } from "@/config/site";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#4F46E5",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "FTChat | Turn your docs into an instant AI support chatbot",
    template: "%s | FTChat",
  },
  description: "Businesses upload their docs, FAQs, and files, and get an embeddable AI chat widget for their website.",
  metadataBase: new URL(siteConfig.url),
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FTChat",
  },
  openGraph: {
    title: "FTChat | Turn your docs into an instant AI support chatbot",
    description: "Businesses upload their docs, FAQs, and files, and get an embeddable AI chat widget for their website.",
    url: siteConfig.url,
    siteName: "FTChat",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FTChat — Instant AI Support Chatbot from Your Knowledge Base",
        type: "image/png",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@ftchat",
    creator: "@ftchat",
    title: "FTChat | Turn your docs into an instant AI support chatbot",
    description: "Businesses upload their docs, FAQs, and files, and get an embeddable AI chat widget for their website.",
    images: ["/twitter-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    console.log('ServiceWorker registered with scope:', reg.scope);
                  }).catch(function(err) {
                    console.error('ServiceWorker registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

