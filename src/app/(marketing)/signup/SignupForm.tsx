"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GoogleButton } from "@/components/ui/google-button";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/utils/supabase/client";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserSupabaseClient();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (authError) {
        setError(authError.message);
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred during Google sign-in");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (data.session) {
        window.location.href = "/onboarding";
      } else if (data.user) {
        alert("Please check your email to confirm your account. After confirming, you will be guided through onboarding.");
        window.location.href = "/login";
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center p-6 py-12 md:py-20">
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold font-display text-brand-600">
            FTChat
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-neutral-900">Create your account</h1>
          <p className="text-xs text-neutral-500 mt-1">Start building your AI assistant today.</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 mb-4">
            <p>{error}</p>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Get Started"}
          </Button>
        </form>

        <div className="mt-6 flex flex-col space-y-4 text-center">
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-neutral-200"></div>
            <span className="flex-shrink mx-4 text-neutral-400 text-xs uppercase">Or</span>
            <div className="flex-grow border-t border-neutral-200"></div>
          </div>

          <GoogleButton
            label="Sign up with Google"
            onClick={handleGoogleSignIn}
            disabled={loading}
          />

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
