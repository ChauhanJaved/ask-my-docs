import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "FTChat | Turn your docs into an instant AI support chatbot",
  description: "Businesses upload their docs, FAQs, and files, and get an embeddable AI chat widget for their website.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://ftchat.io"),
  openGraph: {
    title: "FTChat | Turn your docs into an instant AI support chatbot",
    description: "Businesses upload their docs, FAQs, and files, and get an embeddable AI chat widget for their website.",
    url: "/",
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
    <html lang="en">
      <body
        className={`${inter.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
