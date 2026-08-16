"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ResetPasswordForm() {
  return (
    <div className="flex flex-1 items-center justify-center p-6 py-12 md:py-20">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm p-8 w-full max-w-md transition-colors">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold font-display text-brand-600 dark:text-brand-400">
            FTChat
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-neutral-900 dark:text-white">Reset your password</h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            We will send a password reset link to your email.
          </p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="w-full bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
            />
          </div>

          <Button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white">
            Send Reset Link
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            Remember your password?{" "}
            <Link href="/login" className="text-brand-600 dark:text-brand-400 hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
