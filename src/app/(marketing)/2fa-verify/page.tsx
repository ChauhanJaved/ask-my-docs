"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/utils/supabase/client";

export default function TwoFactorVerifyPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);

  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    async function loadMfaFactors() {
      try {
        const { data: levelData, error: levelError } =
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

        if (levelError) {
          console.error("Error fetching assurance level:", levelError);
        }

        // If user is already AAL2 (already verified 2FA), redirect to dashboard
        if (levelData?.currentLevel === "aal2") {
          window.location.href = "/dashboard";
          return;
        }

        const { data: factorsData, error: factorsError } =
          await supabase.auth.mfa.listFactors();

        if (factorsError) {
          setError(factorsError.message);
          setInitializing(false);
          return;
        }

        const verifiedTotp = factorsData?.totp?.find(
          (f) => f.status === "verified"
        );

        if (!verifiedTotp) {
          // If no verified 2FA factor exists, user doesn't need 2FA verification
          window.location.href = "/dashboard";
          return;
        }

        setFactorId(verifiedTotp.id);
      } catch (err) {
        console.error("Failed to initialize 2FA page:", err);
        setError("Failed to load two-factor authentication details.");
      } finally {
        setInitializing(false);
      }
    }

    loadMfaFactors();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId || !code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Create an MFA Challenge for the factor
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });

      if (challengeError) {
        setError(challengeError.message);
        setLoading(false);
        return;
      }

      // 2. Verify the challenge using the code entered by the user
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: code.trim(),
      });

      if (verifyError) {
        setError(verifyError.message || "Invalid authentication code.");
        setLoading(false);
        return;
      }

      // 3. After successful verification, check onboarding status and redirect
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile || profile.onboarding_completed === false) {
          window.location.href = "/onboarding";
          return;
        }
      }

      window.location.href = "/dashboard";
    } catch (err) {
      console.error("2FA verification error:", err);
      setError("An unexpected error occurred during 2FA verification.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center p-6 py-6 md:py-10 bg-neutral-50 dark:bg-neutral-950">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm p-8 w-full max-w-md transition-colors">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-2xl font-bold font-display text-brand-600 dark:text-brand-400"
          >
            FTChat
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-neutral-900 dark:text-white">
            Two-Factor Authentication
          </h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Enter the 6-digit code from your authenticator app to log in.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/50 border-l-4 border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 p-4 mb-4 text-sm">
            <p>{error}</p>
          </div>
        )}

        {initializing ? (
          <div className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
            Checking authentication requirements...
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleVerify}>
            <div>
              <label
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                htmlFor="code"
              >
                Authentication Code
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full text-center tracking-widest text-lg font-mono bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
                required
                disabled={loading}
                autoFocus
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium"
              disabled={loading || code.length !== 6}
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </Button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/login";
                }}
                className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 underline"
              >
                Back to Login / Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
