import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold font-display text-brand-600">
            FTChat
          </Link>
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

      {/* Content */}
      <main className="flex-1 py-16 px-6 container mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-3xl md:text-5xl font-bold font-display text-neutral-950">Simple, Transparent Pricing</h1>
          <p className="mt-4 text-lg text-neutral-600">Choose the perfect plan for your business support needs.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white p-8 rounded-lg border border-neutral-200 flex flex-col">
            <h3 className="text-lg font-bold text-neutral-900">Free</h3>
            <p className="mt-2 text-sm text-neutral-500">For testing and personal side projects.</p>
            <div className="mt-6 flex items-baseline">
              <span className="text-4xl font-extrabold tracking-tight text-neutral-900">$0</span>
              <span className="ml-1 text-sm font-semibold text-neutral-500">/month</span>
            </div>
            <ul className="mt-8 space-y-4 text-sm text-neutral-600 flex-1">
              <li className="flex items-center">✓ 1 Chatbot Bot</li>
              <li className="flex items-center">✓ Up to 3 Documents (max 5MB each)</li>
              <li className="flex items-center">✓ 50 AI Chats / month</li>
              <li className="flex items-center">✓ Standard RAG logic</li>
            </ul>
            <Link href="/signup" className="mt-8">
              <Button variant="outline" className="w-full">Sign Up Free</Button>
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-white p-8 rounded-lg border-2 border-brand-500 shadow-md flex flex-col relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Popular
            </span>
            <h3 className="text-lg font-bold text-brand-600">Pro</h3>
            <p className="mt-2 text-sm text-neutral-500">For growing businesses needing active support.</p>
            <div className="mt-6 flex items-baseline">
              <span className="text-4xl font-extrabold tracking-tight text-neutral-900">$49</span>
              <span className="ml-1 text-sm font-semibold text-neutral-500">/month</span>
            </div>
            <ul className="mt-8 space-y-4 text-sm text-neutral-600 flex-1">
              <li className="flex items-center">✓ 3 Chatbot Bots</li>
              <li className="flex items-center">✓ Up to 50 Documents (max 10MB each)</li>
              <li className="flex items-center">✓ 1,000 AI Chats / month</li>
              <li className="flex items-center">✓ Custom Theme Options & Chat Widgets</li>
              <li className="flex items-center">✓ URL Scraping & Crawling</li>
            </ul>
            <Link href="/signup" className="mt-8">
              <Button className="w-full bg-brand-600 hover:bg-brand-700 text-white">Start Pro Trial</Button>
            </Link>
          </div>

          {/* Business Plan */}
          <div className="bg-white p-8 rounded-lg border border-neutral-200 flex flex-col">
            <h3 className="text-lg font-bold text-neutral-900">Business</h3>
            <p className="mt-2 text-sm text-neutral-500">For high-traffic operations and enterprise. </p>
            <div className="mt-6 flex items-baseline">
              <span className="text-4xl font-extrabold tracking-tight text-neutral-900">$149</span>
              <span className="ml-1 text-sm font-semibold text-neutral-500">/month</span>
            </div>
            <ul className="mt-8 space-y-4 text-sm text-neutral-600 flex-1">
              <li className="flex items-center">✓ Unlimited Chatbot Bots</li>
              <li className="flex items-center">✓ Up to 500 Documents (max 20MB each)</li>
              <li className="flex items-center">✓ 10,000 AI Chats / month</li>
              <li className="flex items-center">✓ Custom System Prompt Overrides</li>
              <li className="flex items-center">✓ Priority support and API access</li>
            </ul>
            <Link href="/signup" className="mt-8">
              <Button variant="outline" className="w-full">Contact Sales</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
