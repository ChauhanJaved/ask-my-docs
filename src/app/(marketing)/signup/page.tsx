"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen bg-neutral-50 items-center justify-center p-6">
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold font-display text-brand-600">
            AskMyDocs
          </Link>
          <h2 className="mt-4 text-xl font-semibold text-neutral-900">Create your account</h2>
          <p className="text-xs text-neutral-500 mt-1">Start building your AI assistant today.</p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="John Doe"
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
            />
          </div>

          <Button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white">
            Get Started
          </Button>
        </form>

        <div className="mt-6 flex flex-col space-y-4 text-center">
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-neutral-200"></div>
            <span className="flex-shrink mx-4 text-neutral-400 text-xs uppercase">Or</span>
            <div className="flex-grow border-t border-neutral-200"></div>
          </div>

          <Button variant="outline" className="w-full">
            Sign up with Google
          </Button>

          <p className="text-xs text-neutral-600 mt-2">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-600 hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
