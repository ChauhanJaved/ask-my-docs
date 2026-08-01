import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold font-display text-brand-600">AskMyDocs</span>
            <span className="bg-ai-100 text-ai-700 text-xs font-semibold px-2 py-0.5 rounded-full">AI Support</span>
          </div>
          <nav className="hidden md:flex space-x-8 text-sm font-medium text-neutral-600">
            <Link href="/" className="hover:text-brand-500 transition-colors">Features</Link>
            <Link href="/pricing" className="hover:text-brand-500 transition-colors">Pricing</Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-brand-600 hover:bg-brand-700 text-white">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold font-display text-neutral-950 max-w-3xl leading-tight">
          Turn Your Docs into an Instant <span className="text-brand-600">AI Support Agent</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-neutral-600 max-w-2xl leading-relaxed">
          Upload your PDFs, FAQs, and docs, or crawl your website. Get a custom AI chatbot widget embeddable in minutes.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
          <Link href="/signup">
            <Button size="lg" className="bg-brand-600 hover:bg-brand-700 text-white w-full sm:w-auto">
              Start Free Trial
            </Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              View Pricing
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white py-8">
        <div className="container mx-auto px-6 text-center text-sm text-neutral-500">
          <p>© {new Date().getFullYear()} AskMyDocs. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
