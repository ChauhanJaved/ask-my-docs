"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/utils/supabase/client";
import { 
  Sparkles, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight, 
  UserCheck,
  LogIn,
  UserPlus
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface InviteDetails {
  valid: boolean;
  email?: string;
  role?: string;
  organizationName?: string;
  expiresAt?: string;
  error?: string;
}

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [details, setDetails] = useState<InviteDetails | null>(null);
  const [user, setUser] = useState<unknown | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndToken = async () => {
      setLoading(true);
      setErrorMsg(null);

      // Check browser user session
      const supabase = createBrowserSupabaseClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (!token) {
        setDetails({ valid: false, error: "No invitation token was provided." });
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/invitations/verify?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        setDetails(data);
      } catch {
        setDetails({ valid: false, error: "Failed to verify invitation link." });
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndToken();
  }, [token]);

  const handleAcceptInvite = async () => {
    if (!token) return;
    setAccepting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to accept invitation");
      }

      setSuccessMsg(data.message || "Invitation accepted! Redirecting to workspace...");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card/90 border border-border rounded-2xl p-8 shadow-xl text-center max-w-md mx-auto backdrop-blur-xl">
        <div className="h-12 w-12 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Sparkles className="w-6 h-6 animate-spin" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">Verifying Invitation...</h3>
        <p className="text-xs text-muted-foreground">Checking security token & workspace details</p>
      </div>
    );
  }

  if (!details || !details.valid) {
    return (
      <div className="bg-card/90 border border-border rounded-2xl p-8 shadow-xl text-center max-w-md mx-auto backdrop-blur-xl">
        <div className="h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Invalid Invitation</h3>
        <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
          {details?.error || "This invitation link is invalid, expired, or has already been accepted."}
        </p>
        <Link href="/">
          <Button variant="outline" className="w-full text-xs">
            Return to Homepage
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card/90 border border-border rounded-2xl p-8 shadow-2xl text-center max-w-md mx-auto backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-violet-500 flex items-center justify-center text-white mx-auto mb-5 shadow-lg shadow-brand-500/25">
        <Building2 className="w-7 h-7" />
      </div>

      <span className="inline-block px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 font-semibold text-[11px] uppercase tracking-wider mb-3">
        Role: {details.role}
      </span>

      <h2 className="text-2xl font-bold font-display text-foreground mb-2">
        Join &quot;{details.organizationName}&quot;
      </h2>
      <p className="text-xs text-muted-foreground mb-6">
        You have been invited to collaborate on FTChat as an <strong className="text-foreground capitalize">{details.role}</strong>.
      </p>

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 p-3 rounded-xl mb-6 text-xs text-left">
          <p className="font-semibold">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl mb-6 text-xs text-left flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <p className="font-semibold">{successMsg}</p>
        </div>
      )}

      <div className="bg-muted/50 border border-border rounded-xl p-4 text-xs text-left mb-6 space-y-2">
        <div className="flex justify-between border-b border-border/60 pb-2">
          <span className="text-muted-foreground">Invited Email:</span>
          <span className="font-semibold text-foreground">{details.email}</span>
        </div>
        <div className="flex justify-between border-b border-border/60 pb-2">
          <span className="text-muted-foreground">Assigned Role:</span>
          <span className="font-semibold text-brand-600 dark:text-brand-400 uppercase text-[10px] bg-brand-500/10 px-2 py-0.5 rounded">
            {details.role}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status:</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Ready to Join
          </span>
        </div>
      </div>

      {user ? (
        <Button
          onClick={handleAcceptInvite}
          disabled={accepting}
          className="w-full bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-brand-500/20 text-xs gap-2"
        >
          {accepting ? (
            <span>Joining Workspace...</span>
          ) : (
            <>
              <UserCheck className="w-4 h-4" />
              <span>Accept Invitation & Join Team</span>
            </>
          )}
        </Button>
      ) : (
        <div className="space-y-3">
          <p className="text-[11px] text-muted-foreground">
            Sign in or create an account to accept this invitation:
          </p>
          <Button
            onClick={() => router.push(`/onboarding?token=${token}`)}
            className="w-full bg-brand-600 hover:bg-brand-500 text-white text-xs gap-2 py-2.5 rounded-xl"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Account & Join</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/auth?token=${token}`)}
            className="w-full border-border text-foreground hover:bg-accent text-xs gap-2 py-2.5 rounded-xl"
          >
            <LogIn className="w-4 h-4" />
            <span>Log In to Existing Account</span>
          </Button>
        </div>
      )}
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-brand-500 selection:text-white relative overflow-hidden font-sans">
      {/* Background accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-gradient-to-b from-brand-600/15 via-violet-600/10 to-transparent blur-3xl pointer-events-none" />
      
      {/* Header */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between px-6 py-6 z-10">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-brand-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <span>FTChat</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto w-full px-6 py-12 z-10 flex-1 flex flex-col justify-center">
        <Suspense fallback={<div className="text-center text-xs text-muted-foreground">Loading invitation...</div>}>
          <AcceptInviteContent />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full text-center text-xs text-muted-foreground py-6 z-10">
        <p>© {new Date().getFullYear()} FTChat. Multi-tenant AI Support System.</p>
      </footer>
    </div>
  );
}
