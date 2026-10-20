"use client";

import React, { useEffect } from "react";
import { Loader2, CheckCircle2, Clock, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ProcessingModalStatus = "processing" | "success" | "timeout";

export interface BillingProcessingModalProps {
  isOpen: boolean;
  status: ProcessingModalStatus;
  title: string;
  description?: string;
  stepMessage?: string;
  successMessage?: string;
  targetPlanName?: string;
  progress?: number;
  onClose: () => void;
  onDone?: () => void;
}

export function BillingProcessingModal({
  isOpen,
  status,
  title,
  description,
  stepMessage,
  successMessage,
  targetPlanName,
  progress = 0,
  onClose,
  onDone,
}: BillingProcessingModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow escape only if finished or timed out
      if (e.key === "Escape" && isOpen && status !== "processing") {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, status, onClose]);

  if (!isOpen) return null;

  const handleFinish = () => {
    if (onDone) {
      onDone();
    } else {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="billing-processing-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md transition-all duration-300 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && status !== "processing") {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden transform animate-in zoom-in-95 duration-200 text-center">
        {/* Ambient Top Glow */}
        <div
          aria-hidden="true"
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none transition-colors duration-500 ${
            status === "success"
              ? "bg-emerald-500"
              : status === "timeout"
              ? "bg-amber-500"
              : "bg-brand-500"
          }`}
        />

        {/* State 1: Processing */}
        {status === "processing" && (
          <div className="space-y-6 relative z-10">
            {/* Animated Processing Icon */}
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-brand-500/20 border-t-brand-600 dark:border-t-brand-400 animate-spin" />
              <div className="w-14 h-14 rounded-full bg-brand-500/10 dark:bg-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Realtime Synchronization
              </span>
              <h3
                id="billing-processing-title"
                className="text-xl sm:text-2xl font-bold font-display text-neutral-900 dark:text-white"
              >
                {title}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-sm mx-auto">
                {description || "FastSpring is finalizing your transaction and dispatching the confirmation."}
              </p>
            </div>

            {/* Micro-Progress Bar */}
            <div className="space-y-2 pt-1">
              <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-600 dark:bg-brand-400 transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${Math.max(progress, 15)}%` }}
                />
              </div>
              {stepMessage && (
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono animate-pulse">
                  {stepMessage}
                </p>
              )}
            </div>

            {/* Reassurance Footer */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/60 py-2 px-3.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
              <span>Secure transaction. Please keep this tab open.</span>
            </div>
          </div>
        )}

        {/* State 2: Success */}
        {status === "success" && (
          <div className="space-y-6 relative z-10 animate-in zoom-in-95 duration-300">
            <div className="mx-auto w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Workspace Updated
              </span>
              <h3
                id="billing-processing-title"
                className="text-xl sm:text-2xl font-bold font-display text-neutral-900 dark:text-white"
              >
                {targetPlanName ? `Welcome to ${targetPlanName}!` : "Subscription Updated!"}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-sm mx-auto">
                {successMessage || "Your workspace privileges and quotas have been updated successfully."}
              </p>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleFinish}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 font-semibold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Continue to Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* State 3: Graceful Timeout / Background Sync */}
        {status === "timeout" && (
          <div className="space-y-6 relative z-10 animate-in zoom-in-95 duration-300">
            <div className="mx-auto w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-lg shadow-amber-500/10">
              <Clock className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Processing in Background
              </span>
              <h3
                id="billing-processing-title"
                className="text-xl sm:text-2xl font-bold font-display text-neutral-900 dark:text-white"
              >
                Order Received!
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-sm mx-auto">
                {description ||
                  "FastSpring is finalizing your payment. Your workspace will automatically reflect the changes in a few moments."}
              </p>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleFinish}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-xl py-2.5 font-semibold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Return to Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
