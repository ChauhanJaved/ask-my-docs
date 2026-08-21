"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/utils/supabase/client";
import { AlertCircle, ShieldCheck, Clock } from "lucide-react";

export default function TwoFactorVerifyPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasErrorState, setHasErrorState] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const formatErrorMessage = (rawError: string) => {
    const lower = rawError.toLowerCase();
    if (lower.includes("invalid") || lower.includes("code") || lower.includes("mfa")) {
      return "Invalid authentication code. Please check your authenticator app and enter the current 6-digit code.";
    }
    if (lower.includes("expired")) {
      return "The authentication code has expired. Please enter the latest code from your authenticator app.";
    }
    if (lower.includes("rate limit") || lower.includes("too many")) {
      return "Too many failed attempts. Please wait a moment before trying again.";
    }
    return rawError || "Invalid authentication code. Please try again.";
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId || !code.trim()) return;

    setLoading(true);
    setError(null);
    setHasErrorState(false);

    try {
      // 1. Create an MFA Challenge for the factor
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });

      if (challengeError) {
        setError(formatErrorMessage(challengeError.message));
        setHasErrorState(true);
        setLoading(false);
        setTimeout(() => inputRef.current?.select(), 50);
        return;
      }

      // 2. Verify the challenge using the code entered by the user
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: code.trim(),
      });

      if (verifyError) {
        setError(formatErrorMessage(verifyError.message || "Invalid authentication code."));
        setHasErrorState(true);
        setLoading(false);
        setTimeout(() => inputRef.current?.select(), 50);
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
      setError("An unexpected error occurred during 2FA verification. Please try again.");
      setHasErrorState(true);
      setLoading(false);
      setTimeout(() => inputRef.current?.select(), 50);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center p-6 py-6 md:py-10 bg-neutral-50 dark:bg-neutral-950">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-8 w-full max-w-md transition-colors">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-2xl font-bold font-display text-brand-600 dark:text-brand-400 inline-flex items-center gap-2"
          >
            <ShieldCheck className="w-7 h-7 text-brand-600 dark:text-brand-400" />
            FTChat
          </Link>
          <h1 className="mt-4 text-xl font-bold text-neutral-900 dark:text-white font-display">
            Two-Factor Authentication
          </h1>
          <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
            Enter the 6-digit code from your authenticator app (Google Authenticator, Authy, etc.) to log in.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 rounded-xl p-3.5 mb-6 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 animate-in fade-in zoom-in-95 duration-200">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-rose-800 dark:text-rose-200">Authentication Failed</p>
              <p className="leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {initializing ? (
          <div className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
            Checking authentication requirements...
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleVerify}>
            <div>
              <label
                className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5"
                htmlFor="code"
              >
                6-Digit Authentication Code
              </label>
              <input
                ref={inputRef}
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ""));
                  if (hasErrorState) setHasErrorState(false);
                }}
                placeholder="123456"
                className={`w-full text-center tracking-widest text-xl font-mono font-bold bg-white dark:bg-neutral-950 border rounded-xl px-3.5 py-3 focus:outline-none transition-all ${
                  hasErrorState
                    ? "border-rose-500 dark:border-rose-500 ring-2 ring-rose-500/20 text-rose-600 dark:text-rose-400"
                    : "border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                }`}
                required
                disabled={loading}
                autoFocus
              />
            </div>

            {hasErrorState && (
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-950 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Make sure your phone&apos;s clock is set automatically for code synchronization.</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 text-xs rounded-xl transition-all disabled:opacity-50"
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
                className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 underline font-medium"
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

