"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-neutral-50 items-center justify-center p-6">
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold font-display text-brand-600">
            AskMyDocs
          </Link>
          <h2 className="mt-4 text-xl font-semibold text-neutral-900">Sign in to your account</h2>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
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
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-neutral-700" htmlFor="password">
                Password
              </label>
              <Link href="/reset-password" className="text-xs text-brand-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
            />
          </div>

          <Button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white">
            Log In
          </Button>
        </form>

        <div className="mt-6 flex flex-col space-y-4 text-center">
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-neutral-200"></div>
            <span className="flex-shrink mx-4 text-neutral-400 text-xs uppercase">Or</span>
            <div className="flex-grow border-t border-neutral-200"></div>
          </div>

          <Button variant="outline" className="w-full">
            Continue with Google
          </Button>

          <p className="text-xs text-neutral-600 mt-2">
            New to AskMyDocs?{" "}
            <Link href="/signup" className="text-brand-600 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
