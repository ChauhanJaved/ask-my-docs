"use client";

import React, { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
  User,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Lock,
  Copy,
  Check,
  Smartphone,
  Eye,
  EyeOff,
  RefreshCw,
  Info,
} from "lucide-react";

interface ProfileSettingsViewProps {
  initialFullName: string;
  userEmail: string;
}

interface Factor {
  id: string;
  status: 'verified' | 'unverified';
  friendly_name?: string;
  factor_type: 'totp' | string;
}

export function ProfileSettingsView({ initialFullName, userEmail }: ProfileSettingsViewProps) {
  // --- Profile Info State ---
  const [fullName, setFullName] = useState(initialFullName);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // --- Password State ---
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // --- 2FA / MFA State ---
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading2FA, setLoading2FA] = useState(true);
  const [mfaMessage, setMfaMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // 2FA Modal Enrollment State
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollingFactor, setEnrollingFactor] = useState<{
    id: string;
    qrCode: string;
    secret: string;
    uri: string;
  } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Load 2FA Factors on Mount
  useEffect(() => {
    fetch2FAStatus();
  }, []);

  const fetch2FAStatus = async () => {
    setLoading2FA(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      
      const totpFactors = (data?.totp || []) as Factor[];
      setFactors(totpFactors);
    } catch (err) {
      console.error("Error fetching 2FA factors:", err);
    } finally {
      setLoading2FA(false);
    }
  };

  const verifiedFactor = factors.find((f) => f.status === "verified");
  const is2FAEnabled = Boolean(verifiedFactor);

  // --- Handle Profile Update ---
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setIsUpdatingProfile(true);
    setProfileMessage(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("User session expired");

      // 1. Update Supabase Auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() },
      });

      if (authError) throw authError;

      // 2. Update profiles table row
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim() })
        .eq("id", user.id);

      if (profileError) throw profileError;

      setProfileMessage({ type: "success", text: "Profile updated successfully! Refreshing view..." });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setProfileMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update profile.",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // --- Handle Password Change ---
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: "New password must be at least 8 characters long." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setPasswordMessage({ type: "success", text: "Password changed successfully!" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to change password.",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // --- Start 2FA Enrollment ---
  const handleStart2FAEnrollment = async () => {
    setMfaMessage(null);
    setIsVerifyingCode(false);
    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "FTChat",
        friendlyName: `FTChat (${userEmail})`,
      });

      if (error) throw error;

      setEnrollingFactor({
        id: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri,
      });
      setShowEnrollModal(true);
    } catch (err) {
      setMfaMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Could not initialize 2FA setup.",
      });
    }
  };

  // --- Verify & Enable 2FA ---
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollingFactor || !verifyCode.trim()) return;

    setIsVerifyingCode(true);
    setMfaMessage(null);

    try {
      const supabase = createBrowserSupabaseClient();
      
      // Challenge the factor
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: enrollingFactor.id,
      });

      if (challengeError) throw challengeError;

      // Verify challenge with entered code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollingFactor.id,
        challengeId: challengeData.id,
        code: verifyCode.trim(),
      });

      if (verifyError) throw verifyError;

      setMfaMessage({ type: "success", text: "Two-Factor Authentication enabled successfully!" });
      setShowEnrollModal(false);
      setEnrollingFactor(null);
      setVerifyCode("");
      await fetch2FAStatus();
    } catch (err) {
      setMfaMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Invalid code. Please try again.",
      });
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // --- Disable 2FA ---
  const handleDisable2FA = async () => {
    if (!verifiedFactor) return;
    if (!window.confirm("Are you sure you want to disable Two-Factor Authentication? Your account will be less secure.")) {
      return;
    }

    setMfaMessage(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: verifiedFactor.id,
      });

      if (error) throw error;

      setMfaMessage({ type: "success", text: "Two-Factor Authentication has been disabled." });
      await fetch2FAStatus();
    } catch (err) {
      setMfaMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to disable 2FA.",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  // Password strength checker helper
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 25, label: "Weak", color: "bg-rose-500" };
    if (score === 2) return { score: 50, label: "Fair", color: "bg-amber-500" };
    if (score === 3) return { score: 75, label: "Good", color: "bg-blue-500" };
    return { score: 100, label: "Strong", color: "bg-emerald-500" };
  };

  const passStrength = getPasswordStrength(newPassword);

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      {/* Header Banner */}
      <div>
        <h1 className="text-2xl font-bold font-display text-neutral-900 dark:text-white tracking-tight">
          Profile Settings
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Manage your personal account credentials, security preferences, and multi-factor authentication.
        </p>
      </div>

      {/* --- Section 1: Personal Details --- */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm transition-all">
        <div className="flex items-center gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-4 mb-6">
          <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white font-display">
              Personal Information
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Update your account details and public display name.
            </p>
          </div>
        </div>

        {profileMessage && (
          <div
            className={`p-3.5 mb-6 rounded-xl flex items-center gap-2.5 text-xs font-medium ${
              profileMessage.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60"
            }`}
          >
            {profileMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{profileMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="fullName" className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                required
              />
            </div>

            <div>
              <label htmlFor="userEmail" className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="userEmail"
                  type="email"
                  value={userEmail}
                  disabled
                  className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 rounded-xl px-3.5 py-2.5 text-xs cursor-not-allowed"
                />
                <span className="absolute right-3 top-2.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Verified
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
                Contact workspace admin to change primary account email.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isUpdatingProfile || fullName.trim() === initialFullName}
              className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium px-5 py-2 rounded-xl transition-all disabled:opacity-50"
            >
              {isUpdatingProfile ? "Saving Changes..." : "Save Profile"}
            </Button>
          </div>
        </form>
      </div>

      {/* --- Section 2: Password & Security --- */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm transition-all">
        <div className="flex items-center gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-4 mb-6">
          <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white font-display">
              Password & Security
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Ensure your account is using a strong, unique password.
            </p>
          </div>
        </div>

        {passwordMessage && (
          <div
            className={`p-3.5 mb-6 rounded-xl flex items-center gap-2.5 text-xs font-medium ${
              passwordMessage.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60"
            }`}
          >
            {passwordMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{passwordMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 rounded-xl px-3.5 py-2.5 text-xs pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-2.5 space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                      <span>Password strength:</span>
                      <span className="capitalize">{passStrength.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${passStrength.color}`}
                        style={{ width: `${passStrength.score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isUpdatingPassword || !newPassword || !confirmPassword}
              className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium px-5 py-2 rounded-xl transition-all disabled:opacity-50"
            >
              {isUpdatingPassword ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </form>
      </div>

      {/* --- Section 3: Two-Factor Authentication (2FA) --- */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm transition-all">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-neutral-900 dark:text-white font-display">
                  Two-Factor Authentication (2FA)
                </h2>
                {loading2FA ? (
                  <span className="text-[10px] text-neutral-400 animate-pulse">Checking status...</span>
                ) : is2FAEnabled ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                    <Check className="w-3 h-3" /> Enabled
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-700">
                    Disabled
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Add an extra layer of security using an authenticator app (Google Authenticator, Authy, 1Password).
              </p>
            </div>
          </div>
        </div>

        {mfaMessage && (
          <div
            className={`p-3.5 mb-6 rounded-xl flex items-center gap-2.5 text-xs font-medium ${
              mfaMessage.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60"
            }`}
          >
            {mfaMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{mfaMessage.text}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <Smartphone className="w-8 h-8 text-neutral-400 dark:text-neutral-500 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-neutral-900 dark:text-white">
                Authenticator App (TOTP)
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Generate 6-digit security codes from your phone every time you sign in.
              </p>
            </div>
          </div>

          <div>
            {is2FAEnabled ? (
              <Button
                onClick={handleDisable2FA}
                className="bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:hover:bg-rose-950 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 text-xs font-medium px-4 py-2 rounded-xl transition-all"
              >
                Disable 2FA
              </Button>
            ) : (
              <Button
                onClick={handleStart2FAEnrollment}
                className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium px-4 py-2 rounded-xl transition-all"
              >
                Enable 2FA
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* --- 2FA Setup Modal Dialog --- */}
      {showEnrollModal && enrollingFactor && (
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 animate-in fade-in-90 zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-display">
                  Set up 2-Factor Authentication
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowEnrollModal(false);
                  setEnrollingFactor(null);
                }}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Step 1: Scan QR Code */}
            <div className="space-y-4">
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                1. Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):
              </p>

              <div className="flex justify-center p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs max-w-[200px] mx-auto">
                <img
                  src={enrollingFactor.qrCode}
                  alt="2FA Setup QR Code"
                  className="w-40 h-40 object-contain"
                />
              </div>

              <div className="text-center space-y-1">
                <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">
                  Or enter secret code manually:
                </p>
                <div className="flex items-center justify-center gap-2 bg-neutral-50 dark:bg-neutral-950 p-2 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <code className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400 select-all">
                    {enrollingFactor.secret}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(enrollingFactor.secret)}
                    className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    title="Copy Secret"
                  >
                    {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2: Enter Verification Code */}
            <form onSubmit={handleVerify2FA} className="space-y-4 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <div>
                <label htmlFor="verifyCode" className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  2. Enter the 6-digit code from your app:
                </label>
                <input
                  id="verifyCode"
                  type="text"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full text-center text-lg font-mono font-bold tracking-widest bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => {
                    setShowEnrollModal(false);
                    setEnrollingFactor(null);
                  }}
                  className="flex-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-medium py-2.5 rounded-xl transition-all"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isVerifyingCode || verifyCode.length < 6}
                  className="flex-1 bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium py-2.5 rounded-xl transition-all disabled:opacity-50"
                >
                  {isVerifyingCode ? "Verifying..." : "Verify & Enable"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
