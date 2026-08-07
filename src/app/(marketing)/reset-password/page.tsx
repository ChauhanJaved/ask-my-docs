"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen bg-neutral-50 items-center justify-center p-6">
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold font-display text-brand-600">
            FTChat
          </Link>
          <h2 className="mt-4 text-xl font-semibold text-neutral-900">Reset your password</h2>
          <p className="text-xs text-neutral-500 mt-1">
            We will send a password reset link to your email.
          </p>
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

          <Button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white">
            Send Reset Link
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-neutral-600">
            Remember your password?{" "}
            <Link href="/login" className="text-brand-600 hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
