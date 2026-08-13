"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Building2, 
  Bot, 
  FileText, 
  Globe, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  Code2, 
  ShieldCheck,
  MessageSquare
} from "lucide-react";

export default function OnboardingPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [orgName, setOrgName] = useState("");
  const [botName, setBotName] = useState("FTChat Assistant");
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const [greetingMessage, setGreetingMessage] = useState("Hi! How can I help you today?");
  
  // Quick Start Ingestion State
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [ingestType, setIngestType] = useState<"url" | "file">("url");

  const handleNextStep = () => {
    if (step < 4) {
      setStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleFinishOnboarding = async () => {
    setLoading(true);
    try {
      // 1. Call completion API endpoint
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName,
          botName,
          primaryColor,
          greetingMessage,
        }),
      });

      if (!res.ok) {
        console.warn("Onboarding complete API returned error, proceeding to dashboard.");
      }

      // Also update local storage as fallback for instant middleware check
      localStorage.setItem("ftchat_onboarded", "true");
      
      // Navigate to main dashboard
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Onboarding submission error:", err);
      window.location.href = "/dashboard";
    } finally {
      setLoading(false);
    }
  };

  const presetColors = [
    { name: "Indigo", hex: "#6366f1" },
    { name: "Violet", hex: "#8b5cf6" },
    { name: "Emerald", hex: "#10b981" },
    { name: "Sky Blue", hex: "#0284c7" },
    { name: "Rose", hex: "#f43f5e" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-brand-500 selection:text-white relative overflow-hidden font-sans">
      {/* Background Glow Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-brand-600/20 via-violet-600/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-brand-500/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between px-6 py-6 z-10">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-white">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-brand-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <span>FTChat</span>
        </Link>
        <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-full px-3 py-1 text-xs text-slate-400 backdrop-blur-md">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Interactive Setup</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto w-full px-6 py-8 z-10 flex-1 flex flex-col justify-center">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center text-xs font-medium mb-3 text-slate-400">
            <span className="flex items-center gap-1.5 text-brand-400">
              <Sparkles className="w-3.5 h-3.5" /> Step {step} of 4
            </span>
            <span>
              {step === 1 && "Workspace Setup"}
              {step === 2 && "Platform Overview"}
              {step === 3 && "First Knowledge Item"}
              {step === 4 && "Ready to Launch"}
            </span>
          </div>
          <div className="h-2 w-full bg-slate-900 rounded-full p-0.5 border border-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-violet-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* STEP 1: Workspace & Bot Customization */}
        {step === 1 && (
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Configure Your AI Assistant</h2>
                <p className="text-xs text-slate-400">Set your organization name and bot style</p>
              </div>
            </div>

            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleNextStep(); }}>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Organization / Company Name
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Acme Inc"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Bot Name
                </label>
                <div className="relative">
                  <Bot className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                    placeholder="e.g. FTChat Support Assistant"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Welcome Greeting Message
                </label>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={greetingMessage}
                    onChange={(e) => setGreetingMessage(e.target.value)}
                    placeholder="e.g. Hi! How can I help you today?"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
                  <span>Widget Brand Color</span>
                  <span className="text-[10px] text-slate-400 capitalize">{primaryColor}</span>
                </label>
                <div className="flex items-center gap-3">
                  {presetColors.map((color) => (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setPrimaryColor(color.hex)}
                      className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${
                        primaryColor === color.hex
                          ? "ring-2 ring-white scale-110 shadow-lg shadow-brand-500/20"
                          : "hover:scale-105 opacity-80"
                      }`}
                      style={{ backgroundColor: color.hex }}
                    >
                      {primaryColor === color.hex && <CheckCircle2 className="w-4 h-4 text-white drop-shadow" />}
                    </button>
                  ))}
                  <div className="relative flex items-center">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-9 w-9 rounded-xl border-0 p-0 cursor-pointer bg-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" className="bg-brand-600 hover:bg-brand-500 text-white gap-2 px-6 rounded-xl">
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: Interactive Product Overview */}
        {step === 2 && (
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">How FTChat Works</h2>
                <p className="text-xs text-slate-400">Transform your documentation into a smart AI agent in 3 steps</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 shrink-0 font-bold">
                  1
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-400" />
                    <span>Upload Documents or Paste Web URLs</span>
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Upload PDFs, TXT, DOCX files or crawl your documentation website. FTChat extracts content automatically.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0 font-bold">
                  2
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <span>Automated AI Vector Training (RAG)</span>
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Text is parsed into semantic chunks and stored in pgvector embeddings, guaranteeing accurate answers strictly from your content.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 font-bold">
                  3
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-emerald-400" />
                    <span>Embed Script Widget on Any Website</span>
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Copy a single <code className="text-emerald-400 bg-slate-900 px-1.5 py-0.5 rounded text-[11px] font-mono">&lt;script&gt;</code> snippet onto your site or web app to launch an instant AI customer support chat window.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button type="button" variant="outline" onClick={handlePrevStep} className="border-slate-700 text-slate-300 hover:bg-slate-800">
                Back
              </Button>
              <Button type="button" onClick={handleNextStep} className="bg-brand-600 hover:bg-brand-500 text-white gap-2 px-6 rounded-xl">
                <span>Understood, Next</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Quick Start / First Knowledge Seed */}
        {step === 3 && (
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Add Your First Knowledge Base Item</h2>
                <p className="text-xs text-slate-400">Provide a website URL or skip to add documents later in the dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-6 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setIngestType("url")}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                  ingestType === "url" ? "bg-brand-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Website URL</span>
              </button>
              <button
                type="button"
                onClick={() => setIngestType("file")}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                  ingestType === "file" ? "bg-brand-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Upload PDF / File</span>
              </button>
            </div>

            {ingestType === "url" ? (
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Documentation or FAQ URL
                  </label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://example.com/docs"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Tip: You can add multiple websites and PDF documents from your dashboard anytime.
                </p>
              </div>
            ) : (
              <div className="mb-8 border-2 border-dashed border-slate-800 hover:border-brand-500/50 rounded-2xl p-6 text-center bg-slate-950/40 transition-all cursor-pointer">
                <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-300 mb-1">Click to select or drop a file (PDF, TXT, DOCX)</p>
                <p className="text-[10px] text-slate-500">Up to 10MB file size</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <Button type="button" variant="outline" onClick={handlePrevStep} className="border-slate-700 text-slate-300 hover:bg-slate-800">
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" onClick={handleNextStep} className="text-slate-400 hover:text-slate-200">
                  Skip for Now
                </Button>
                <Button type="button" onClick={handleNextStep} className="bg-brand-600 hover:bg-brand-500 text-white gap-2 px-6 rounded-xl">
                  <span>Save & Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Ready to Launch */}
        {step === 4 && (
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-brand-500 to-violet-500 flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-brand-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-bold text-white tracking-tight mb-2">You&apos;re All Set!</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              Your organization workspace <span className="text-white font-medium">&quot;{orgName || "FTChat Workspace"}&quot;</span> has been created.
            </p>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-left max-w-md mx-auto mb-8 space-y-2">
              <div className="flex justify-between text-xs py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Assistant Name:</span>
                <span className="text-white font-medium">{botName}</span>
              </div>
              <div className="flex justify-between text-xs py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Brand Color:</span>
                <span className="flex items-center gap-1.5 text-white font-medium">
                  <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ backgroundColor: primaryColor }} />
                  {primaryColor}
                </span>
              </div>
              <div className="flex justify-between text-xs py-1">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Ready to train & embed
                </span>
              </div>
            </div>

            <Button
              onClick={handleFinishOnboarding}
              disabled={loading}
              className="w-full max-w-md bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-brand-500/25 transition-all text-sm gap-2"
            >
              {loading ? (
                <span>Launching Dashboard...</span>
              ) : (
                <>
                  <span>Enter FTChat Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full text-center text-xs text-slate-500 py-6 z-10">
        <p>© {new Date().getFullYear()} FTChat. Multi-tenant AI Support System.</p>
      </footer>
    </div>
  );
}
