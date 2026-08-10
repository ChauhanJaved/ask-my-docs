"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Upload,
  Code,
  ArrowRight,
  Check,
  ChevronDown,
  Settings,
  BarChart3,
  Globe,
  Sliders,
  FileText,
  Lock
} from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  citations?: string[];
  timestamp: string;
}

const PRESETS = [
  {
    question: "How does document ingestion work?",
    answer: "We automatically parse your uploaded PDFs, Markdown, and TXT files, chunking the content into ~500-token sections using recursive character splitting. We then generate vector embeddings via pgvector in Supabase, allowing semantically accurate lookup.",
    citations: ["FAQ_Ingestion.pdf (Page 2)", "docs_setup.md (Line 42)"]
  },
  {
    question: "Can I crawl my documentation URL?",
    answer: "Absolutely! Just enter your website's documentation URL. Our background crawler extracts clean HTML, strips headers/footers, segments the articles into semantic sections, and updates your chatbot context. You can sync it on-demand.",
    citations: ["Crawler_Guide.md (Line 18)", "site_map_parser.js (Line 7)"]
  },
  {
    question: "How do I embed the chat widget?",
    answer: "You copy a single line of script tag from your FTChat settings dashboard and paste it right before the closing </body> tag of your website. It loads asynchronously, meaning it won't impact your site's SEO or loading speeds.",
    citations: ["Widget_Embed.md (Line 12)"]
  }
];

export function LandingPageClient() {

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      sender: "bot",
      text: "Hi! I'm the FTChat AI Assistant. Click one of the test questions below to see how I retrieve answers from your documentation in real-time!",
      timestamp: "12:00 PM"
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [activePresetIndex, setActivePresetIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [activeStep, setActiveStep] = useState(1);
  const [isYearly, setIsYearly] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping]);

  const handlePresetClick = (index: number) => {
    if (isTyping) return;
    const preset = PRESETS[index];
    setActivePresetIndex(index);

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: preset.question,
      timestamp: timeString
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: preset.answer,
        citations: preset.citations,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages((prev) => [...prev, botMsg]);
    }, 1800);
  };

  const handleResetChat = () => {
    setChatMessages([
      {
        id: "init",
        sender: "bot",
        text: "Hi! I'm the FTChat AI Assistant. Click one of the test questions below to see how I retrieve answers from your documentation in real-time!",
        timestamp: "12:00 PM"
      }
    ]);
    setIsTyping(false);
    setActivePresetIndex(null);
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const plans = [
    {
      name: "Starter",
      description: "Perfect for side projects and validating your initial customer FAQs.",
      priceMonthly: 0,
      priceYearly: 0,
      features: [
        "1 AI Chatbot widget",
        "Up to 5 documents (PDF, MD, TXT)",
        "100 chat messages / month",
        "Standard semantic search accuracy",
        "FTChat branding on widget",
        "Community support access"
      ],
      cta: "Get Started Free",
      popular: false,
      href: "/signup"
    },
    {
      name: "Pro",
      description: "Our most popular tier. Ideal for growing software teams and customer desks.",
      priceMonthly: 49,
      priceYearly: 39,
      features: [
        "5 AI Chatbot widgets",
        "Unlimited document ingestion",
        "Website URL Crawler (auto-sync)",
        "2,000 chat messages / month",
        "Custom styling (remove branding)",
        "Conversation logs & analytics dashboard",
        "Priority email support (24h)"
      ],
      cta: "Start Free Trial",
      popular: true,
      href: "/signup"
    },
    {
      name: "Enterprise",
      description: "For high-volume sites needing human-in-the-loop and dedicated resources.",
      priceMonthly: 199,
      priceYearly: 159,
      features: [
        "Unlimited AI Chatbot widgets",
        "Unlimited document ingestion & crawl URLs",
        "10,000 chat messages / month",
        "Smart human handoff workflow",
        "AI-suggested content gaps report",
        "Dedicated API key access",
        "Dedicated account manager & SLA support"
      ],
      cta: "Contact Sales",
      popular: false,
      href: "/signup"
    }
  ];

  const faqs = [
    {
      q: "Which file formats are supported for document ingestion?",
      a: "FTChat supports PDF files, Markdown (.md), plaintext (.txt), and Word documents (.docx). Additionally, we provide an automatic URL web crawler that scraps, cleans, and segments content directly from public documentation links."
    },
    {
      q: "Can I customize the look and feel of the widget?",
      a: "Yes! On our Pro and Enterprise plans, you can fully match the chatbot widget with your brand. Customize the accent color, launcher icon, header text, welcome prompt, and avatar to make the assistant blend seamlessly into your product."
    },
    {
      q: "How does the 'human-in-the-loop' handoff work?",
      a: "If the AI widget encounters a question it cannot answer with high confidence (or if the user requests human support), it displays a contact form. This triggers a ticket that goes straight to your team dashboard or hooks into your support email address."
    },
    {
      q: "Is my customer data secure?",
      a: "Absolutely. Security is central to FTChat. All document contents are stored inside isolated Supabase databases with Row Level Security (RLS) policies. We do not use your proprietary documents to train public foundational LLM models."
    },
    {
      q: "What happens if I exceed my monthly message limits?",
      a: "If you approach your limit, we'll notify you. We offer soft limits so your service isn't abruptly cut off, giving you a grace period to upgrade. Additional message packages can also be purchased on demand."
    }
  ];

  return (
    <>
      {/* Background Gradient Mesh */}
      <div className="absolute top-0 left-0 right-0 h-[600px] bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.08)_0%,_rgba(139,92,246,0.03)_50%,_rgba(0,0,0,0)_100%)] pointer-events-none z-0" />


      {/* HERO SECTION */}
      <section className="relative flex-1 flex flex-col justify-center items-center px-6 pt-16 pb-20 md:pt-24 md:pb-32 text-center max-w-7xl mx-auto z-10">
        
        {/* Sparkle Badge */}
        <div className="inline-flex items-center space-x-2 bg-brand-50 border border-brand-100 px-3 py-1 rounded-full text-xs font-semibold text-brand-700 mb-6 shadow-sm animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-brand-500 fill-brand-500" />
          <span>Next-Gen RAG Support Integration</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-display text-neutral-950 max-w-4xl tracking-tight leading-[1.1] md:leading-[1.15] mb-6">
          Turn Your Docs into an Instant <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-ai-500 bg-clip-text text-transparent drop-shadow-sm">
            AI Customer Support Agent
          </span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-neutral-600 max-w-2xl leading-relaxed mb-10">
          Upload your PDFs, manuals, and text files, or drop your API docs URL. Ingest in seconds and deploy a beautiful, custom AI chat widget directly on your website.
        </p>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center w-full max-w-md mb-20">
          <Link href="/signup" className="w-full sm:w-auto">
            <Button size="lg" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-lg shadow-brand-600/25 hover:shadow-brand-600/35 transition-all duration-200 flex items-center justify-center space-x-2">
              <span>Start Ingesting Free</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <a href="#how-it-works" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full border-neutral-300 text-neutral-700 hover:bg-neutral-100 hover:border-neutral-400 font-semibold transition-all">
              Watch Setup Guide
            </Button>
          </a>
        </div>

        {/* INTERACTIVE CHAT WIDGET DEMO */}
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch text-left">
          
          {/* Pitch Panel */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
            <h3 className="text-2xl font-bold font-display text-neutral-900">
              See the Widget in Action
            </h3>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Our embeddable widget isn&apos;t just a generic wrapper around OpenAI. It performs intelligent semantical document lookup, returns precise cited references, and triggers customizable fallback channels.
            </p>
            
            <div className="space-y-3">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Click a prompt to test ingestion
              </p>
              <div className="flex flex-col space-y-2">
                {PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePresetClick(idx)}
                    disabled={isTyping}
                    className={`p-3 rounded-lg border text-xs text-left font-medium transition-all duration-200 flex items-center justify-between ${
                      activePresetIndex === idx
                        ? "bg-brand-50 border-brand-300 text-brand-700 shadow-sm"
                        : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300"
                    } disabled:opacity-50`}
                  >
                    <span>{preset.question}</span>
                    <ArrowRight className={`w-3.5 h-3.5 text-neutral-400 shrink-0 ml-2 transition-transform duration-200 ${
                      activePresetIndex === idx ? "translate-x-1 text-brand-500" : ""
                    }`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
              <span className="text-xs text-neutral-500 flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                Live Demo Sandbox
              </span>
              <button 
                onClick={handleResetChat}
                className="text-xs text-neutral-500 hover:text-brand-600 font-semibold transition-colors"
              >
                Clear History
              </button>
            </div>
          </div>

          {/* Simulated Chat Phone Frame */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-neutral-200 shadow-xl overflow-hidden flex flex-col min-h-[460px] max-h-[500px]">
            {/* Widget Bar */}
            <div className="bg-gradient-to-r from-brand-600 to-ai-600 px-6 py-4 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-display font-bold text-xs">
                  AI
                </div>
                <div>
                  <h4 className="text-sm font-bold leading-none">FTChat Assistant</h4>
                  <span className="text-[10px] text-brand-100 flex items-center mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                    Answers from local documentation
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-white/80">
                <div className="w-2 h-2 rounded-full bg-white/20" />
                <div className="w-2 h-2 rounded-full bg-white/20" />
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-neutral-50/50">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[85%] ${
                    msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                  } animate-slide-up-fade`}
                >
                  <div
                    className={`p-3.5 text-sm leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-brand-600 text-white rounded-2xl rounded-tr-sm"
                        : "bg-white border border-neutral-200 text-neutral-800 rounded-2xl rounded-tl-sm shadow-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    
                    {/* Render Citations if available */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-neutral-100">
                        <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                          Sources Retrieved
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {msg.citations.map((cite, cidx) => (
                            <span
                              key={cidx}
                              className="inline-flex items-center px-2 py-0.5 rounded bg-brand-50 text-brand-700 text-[10px] font-medium border border-brand-100"
                            >
                              <FileText className="w-2.5 h-2.5 mr-1 text-brand-500" />
                              {cite}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-neutral-400 mt-1">{msg.timestamp}</span>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex flex-col items-start max-w-[85%] mr-auto">
                  <div className="p-3.5 bg-white border border-neutral-200 rounded-2xl rounded-tl-sm shadow-sm flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-neutral-400 animate-typing-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-neutral-400 animate-typing-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-neutral-400 animate-typing-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Simulated Inputs */}
            <div className="p-3 bg-white border-t border-neutral-200 flex items-center space-x-2 shrink-0">
              <input
                type="text"
                disabled
                placeholder="Select a preset question to ask..."
                className="flex-1 bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2 text-xs text-neutral-400 focus:outline-none"
              />
              <Button size="sm" disabled className="bg-neutral-100 text-neutral-400">
                Send
              </Button>
            </div>
          </div>
        </div>

      </section>

      {/* SOCIAL PROOF: LOGO CLOUD */}
      <section className="bg-white border-y border-neutral-200 py-10 z-10">
        <div className="container mx-auto px-6 text-center">
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-6">
            Designed for Modern Tech Architectures
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-300">
            <div className="flex items-center space-x-2 text-neutral-800">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 4l6 12H6l6-12z"/></svg>
              <span className="font-bold text-sm tracking-tight">VERCEL</span>
            </div>
            <div className="flex items-center space-x-2 text-neutral-800">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20.08 11.42l-7.23-7.23a1.21 1.21 0 00-1.7 0L3.92 11.42a1.21 1.21 0 000 1.7l7.23 7.23a1.21 1.21 0 001.7 0l7.23-7.23a1.21 1.21 0 000-1.7zm-8.08 5.75L6.83 12.00 12.00 6.83 17.17 12.00 12.00 17.17z"/></svg>
              <span className="font-bold text-sm tracking-tight">SUPABASE</span>
            </div>
            <div className="flex items-center space-x-2 text-neutral-800">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M13.97 11.03l-4.94 4.94 2.83 2.83 4.94-4.94-2.83-2.83zm-1.89-6.38L2 14.7l2.83 2.83 10.05-10.05-2.8-2.83z"/></svg>
              <span className="font-bold text-sm tracking-tight">TAILWIND</span>
            </div>
            <div className="flex items-center space-x-2 text-neutral-800">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-4H6v-2h12v2z"/></svg>
              <span className="font-bold text-sm tracking-tight">STRIPE</span>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section id="features" className="py-20 md:py-28 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <span className="text-xs font-bold text-brand-600 uppercase tracking-widest bg-brand-50 border border-brand-100 px-3 py-1 rounded-full">
            Powerful Feature Set
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-neutral-950 mt-4 leading-tight">
            Everything You Need to Resolve <br className="hidden sm:inline" />
            Support Queries Instantly
          </h2>
          <p className="text-neutral-600 mt-4 text-base sm:text-lg">
            Stop forcing your users to parse endless documentation directories. Let them query your knowledge base directly with contextual precision.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm hover:shadow-md hover:border-neutral-300 transition-all duration-200 group">
            <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-200">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold font-display text-neutral-900 group-hover:text-brand-600 transition-colors">
              Intelligent Doc Ingestion
            </h3>
            <p className="text-neutral-500 text-sm mt-3 leading-relaxed">
              Support for PDFs, plaintext, Markdown, and docx. Files are parsed, chunked semantically, and mapped directly to your vector index.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm hover:shadow-md hover:border-neutral-300 transition-all duration-200 group">
            <div className="w-10 h-10 rounded-lg bg-ai-50 text-ai-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-200">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold font-display text-neutral-900 group-hover:text-ai-600 transition-colors">
              Automatic URL Crawler
            </h3>
            <p className="text-neutral-500 text-sm mt-3 leading-relaxed">
              Paste your documentation URLs or sitemaps. Our background processor scrapes pages, removes clutter, and updates embeddings automatically.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm hover:shadow-md hover:border-neutral-300 transition-all duration-200 group">
            <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-200">
              <Code className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold font-display text-neutral-900 group-hover:text-brand-600 transition-colors">
              Simple Embed Code
            </h3>
            <p className="text-neutral-500 text-sm mt-3 leading-relaxed">
              Integration takes minutes. Just paste our lightweight async JS script tag in your HTML file to unlock live client-side chat support.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm hover:shadow-md hover:border-neutral-300 transition-all duration-200 group">
            <div className="w-10 h-10 rounded-lg bg-ai-50 text-ai-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-200">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold font-display text-neutral-900 group-hover:text-ai-600 transition-colors">
              Hybrid Human Handoff
            </h3>
            <p className="text-neutral-500 text-sm mt-3 leading-relaxed">
              If the AI chatbot is stumped or a user asks for human help, the widget transitions to a structured ticket submission form seamlessly.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm hover:shadow-md hover:border-neutral-300 transition-all duration-200 group">
            <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-200">
              <Settings className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold font-display text-neutral-900 group-hover:text-brand-600 transition-colors">
              Tailored Branding
            </h3>
            <p className="text-neutral-500 text-sm mt-3 leading-relaxed">
              Match your brand colors, custom avatars, logos, and adjust the assistant&apos;s tone (from formal to casual/friendly).
            </p>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm hover:shadow-md hover:border-neutral-300 transition-all duration-200 group">
            <div className="w-10 h-10 rounded-lg bg-ai-50 text-ai-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-200">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold font-display text-neutral-900 group-hover:text-ai-600 transition-colors">
              Content Gap Analysis
            </h3>
            <p className="text-neutral-500 text-sm mt-3 leading-relaxed">
              Track unanswered queries in real-time. Our dashboard surfaces analytics to let you know exactly what docs to add next.
            </p>
          </div>

        </div>
      </section>

      {/* INTERACTIVE "HOW IT WORKS" STEPPER */}
      <section id="how-it-works" className="bg-neutral-100/70 border-y border-neutral-200 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
              Integration Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-neutral-950 mt-3">
              Up and Running in 3 Simple Steps
            </h2>
            <p className="text-neutral-600 mt-3 text-sm sm:text-base">
              Setting up your chatbot dashboard is straightforward. Here is how you do it.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5 space-y-4">
              
              <button
                onClick={() => setActiveStep(1)}
                className={`w-full text-left p-5 rounded-xl border transition-all duration-200 ${
                  activeStep === 1
                    ? "bg-white border-brand-300 shadow-md"
                    : "bg-transparent border-transparent hover:bg-white/40"
                }`}
              >
                <div className="flex items-start space-x-4">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    activeStep === 1 ? "bg-brand-600 text-white" : "bg-neutral-200 text-neutral-600"
                  }`}>
                    1
                  </span>
                  <div>
                    <h4 className="text-base font-bold text-neutral-900 leading-tight">
                      Upload or Crawl Documentation
                    </h4>
                    <p className="text-neutral-500 text-xs mt-1.5 leading-relaxed">
                      Upload PDFs, FAQs, or paste documentation website URLs. FTChat auto-segments the content into vectorized context chunks.
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveStep(2)}
                className={`w-full text-left p-5 rounded-xl border transition-all duration-200 ${
                  activeStep === 2
                    ? "bg-white border-brand-300 shadow-md"
                    : "bg-transparent border-transparent hover:bg-white/40"
                }`}
              >
                <div className="flex items-start space-x-4">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    activeStep === 2 ? "bg-brand-600 text-white" : "bg-neutral-200 text-neutral-600"
                  }`}>
                    2
                  </span>
                  <div>
                    <h4 className="text-base font-bold text-neutral-900 leading-tight">
                      Customize Rules and Styling
                    </h4>
                    <p className="text-neutral-500 text-xs mt-1.5 leading-relaxed">
                      Adjust your bot&apos;s behavior instructions. Define greeting messages, target colors, customer fallback settings, and system prompt contexts.
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveStep(3)}
                className={`w-full text-left p-5 rounded-xl border transition-all duration-200 ${
                  activeStep === 3
                    ? "bg-white border-brand-300 shadow-md"
                    : "bg-transparent border-transparent hover:bg-white/40"
                }`}
              >
                <div className="flex items-start space-x-4">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    activeStep === 3 ? "bg-brand-600 text-white" : "bg-neutral-200 text-neutral-600"
                  }`}>
                    3
                  </span>
                  <div>
                    <h4 className="text-base font-bold text-neutral-900 leading-tight">
                      Deploy the Chat Widget
                    </h4>
                    <p className="text-neutral-500 text-xs mt-1.5 leading-relaxed">
                      Copy the custom script tag from your admin workspace settings page and paste it into your CMS header or index HTML wrapper.
                    </p>
                  </div>
                </div>
              </button>

            </div>

            <div className="lg:col-span-7 bg-white border border-neutral-200 rounded-xl p-6 shadow-lg min-h-[300px] flex flex-col justify-center">
              {activeStep === 1 && (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                    <span className="text-xs font-bold text-neutral-800 flex items-center">
                      <Upload className="w-3.5 h-3.5 mr-2 text-brand-600" />
                      Document Source Console
                    </span>
                    <span className="text-[10px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full font-medium">
                      Supabase Storage / Vector Pipeline
                    </span>
                  </div>
                  <div className="border-2 border-dashed border-neutral-200 rounded-lg p-8 text-center bg-neutral-50/50 hover:bg-neutral-50 hover:border-brand-300 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-3" />
                    <p className="text-xs font-semibold text-neutral-800">
                      Drag and drop your PDF, MD or TXT files
                    </p>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      Max file size: 10MB (Free plan limits: 5 docs)
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] text-neutral-500">
                    <span className="font-semibold text-neutral-700">Or ingest from web:</span>
                    <input 
                      type="text" 
                      placeholder="https://docs.yourbrand.com" 
                      disabled
                      className="flex-1 bg-neutral-100 border border-neutral-200 rounded px-2 py-1 text-[10px]"
                    />
                    <button className="bg-brand-600 text-white rounded px-2.5 py-1 text-[10px] font-medium" disabled>
                      Crawl URL
                    </button>
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                    <span className="text-xs font-bold text-neutral-800 flex items-center">
                      <Sliders className="w-3.5 h-3.5 mr-2 text-brand-600" />
                      Widget Customization Panel
                    </span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-medium">
                      Live Preview Active
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wide mb-1">
                          Widget Theme Accent
                        </label>
                        <div className="flex items-center space-x-2">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 border border-neutral-300 ring-2 ring-indigo-200 cursor-pointer" />
                          <span className="w-5 h-5 rounded-full bg-violet-600 border border-neutral-300 cursor-pointer" />
                          <span className="w-5 h-5 rounded-full bg-blue-600 border border-neutral-300 cursor-pointer" />
                          <span className="w-5 h-5 rounded-full bg-emerald-600 border border-neutral-300 cursor-pointer" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wide mb-1">
                          AI Personality Tone
                        </label>
                        <div className="w-full bg-neutral-100 h-1.5 rounded-full relative">
                          <div className="bg-brand-600 h-1.5 rounded-full w-2/3" />
                          <span className="absolute -top-1 left-2/3 w-3.5 h-3.5 rounded-full bg-white border border-brand-500 shadow-sm" />
                        </div>
                        <div className="flex justify-between text-[9px] text-neutral-400 mt-1">
                          <span>Concise / Corporate</span>
                          <span>Helpful / Friendly</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wide mb-1">
                        AI System Prompt Guardrails
                      </label>
                      <textarea
                        disabled
                        className="w-full bg-neutral-50 border border-neutral-200 rounded p-2 text-[10px] text-neutral-500 resize-none h-20"
                        value="You are a support agent for Acme Corp. You only answer client questions using the provided context chunks. If you cannot find the answer, politely request they fill out the support form."
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                    <span className="text-xs font-bold text-neutral-800 flex items-center">
                      <Code className="w-3.5 h-3.5 mr-2 text-brand-600" />
                      Deployment Snippet
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      Copy HTML Code
                    </span>
                  </div>
                  <p className="text-neutral-500 text-xs">
                    Copy this small asynchronous loader script tag and paste it at the bottom of your HTML pages.
                  </p>
                  <div className="bg-neutral-900 rounded-lg p-3 relative overflow-hidden font-mono text-[10px] leading-relaxed text-neutral-300 border border-neutral-800">
                    <div className="absolute top-2 right-2">
                      <span className="text-[8px] bg-neutral-800 px-2 py-0.5 rounded text-neutral-400 font-sans font-semibold">
                        HTML SNIPPET
                      </span>
                    </div>
                    <code>
                      {`<!-- FTChat Chat Widget Loader -->`}
                      <br />
                      {`<script`}
                      <br />
                      {`  async`}
                      <br />
                      {`  src="https://cdn.ftchat.com/widget.js"`}
                      <br />
                      {`  data-org-id="org_8d5c2a19ff"`}
                      <br />
                      {`  data-theme="#4f46e5"`}
                      <br />
                      {`></script>`}
                    </code>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button size="sm" className="bg-brand-600 hover:bg-brand-700 text-white text-[10px] px-3 h-8 flex items-center space-x-1">
                      <Check className="w-3 h-3" />
                      <span>Copy Embed Code</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </section>

      {/* PRICING PREVIEW */}
      <section id="pricing" className="py-20 md:py-28 max-w-7xl mx-auto px-6">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-brand-600 uppercase tracking-widest bg-brand-50 border border-brand-100 px-3 py-1 rounded-full">
            Transparent Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-neutral-950 mt-4 tracking-tight">
            Flexible Plans for Teams of All Sizes
          </h2>
          <p className="text-neutral-600 mt-4 text-sm sm:text-base">
            Start completely free. No credit card required. Upgrade, downgrade, or cancel subscription configurations at any time.
          </p>

          <div className="mt-8 inline-flex items-center space-x-3 bg-neutral-200/80 p-1 rounded-full border border-neutral-300">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                !isYearly
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all relative ${
                isYearly
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <span>Yearly Billing</span>
              <span className="absolute -top-4 -right-8 bg-brand-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, idx) => {
            const displayPrice = isYearly ? plan.priceYearly : plan.priceMonthly;
            return (
              <div
                key={idx}
                className={`bg-white rounded-xl border relative flex flex-col justify-between transition-all duration-300 overflow-hidden ${
                  plan.popular
                    ? "border-brand-500 shadow-lg ring-1 ring-brand-500 scale-100 md:scale-[1.03] z-10"
                    : "border-neutral-200 shadow-sm hover:shadow-md hover:border-neutral-300"
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-brand-500 text-white text-[10px] font-bold tracking-wider px-3.5 py-1 rounded-bl-lg uppercase">
                    Most Popular
                  </div>
                )}

                <div className="p-6 md:p-8 flex-1">
                  <h3 className="text-xl font-bold font-display text-neutral-950">
                    {plan.name}
                  </h3>
                  <p className="text-neutral-500 text-xs mt-2 leading-relaxed">
                    {plan.description}
                  </p>
                  
                  <div className="mt-6 flex items-baseline text-neutral-900">
                    <span className="text-4xl font-extrabold font-display tracking-tight">
                      ${displayPrice}
                    </span>
                    <span className="text-neutral-500 text-xs font-medium ml-1.5">
                      / month
                    </span>
                  </div>
                  {isYearly && plan.priceMonthly > 0 && (
                    <span className="text-[10px] text-brand-600 font-semibold block mt-1">
                      Billed annually (save ${ (plan.priceMonthly - plan.priceYearly) * 12 }/yr)
                    </span>
                  )}

                  <hr className="border-neutral-200 my-6" />

                  <ul className="space-y-3.5">
                    {plan.features.map((feature, fidx) => (
                      <li key={fidx} className="flex items-start text-xs text-neutral-600">
                        <Check className="w-3.5 h-3.5 text-brand-600 shrink-0 mr-2.5 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 md:p-8 bg-neutral-50 border-t border-neutral-100">
                  <Link href={plan.href} className="block w-full">
                    <Button
                      className={`w-full justify-center font-semibold transition-all ${
                        plan.popular
                          ? "bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/20"
                          : "bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300"
                      }`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="bg-white border-t border-neutral-200 py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6">
          
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
              Frequently Asked Questions
            </span>
            <h2 className="text-3xl font-bold font-display text-neutral-950 mt-3 tracking-tight">
              Have Questions? We Have Answers.
            </h2>
            <p className="text-neutral-500 mt-3 text-sm">
              If you don&apos;t find what you are looking for, contact our support portal.
            </p>
          </div>

          <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-200 overflow-hidden shadow-sm bg-white">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={index} className="transition-colors duration-200 hover:bg-neutral-50/50">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between text-left p-5 text-sm font-bold text-neutral-900 focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-200 shrink-0 ml-4 ${
                      isOpen ? "rotate-180 text-brand-600" : ""
                    }`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? "max-h-[200px]" : "max-h-0"
                  }`}>
                    <p className="text-xs leading-relaxed text-neutral-600 p-5 pt-0 border-t border-neutral-100/50">
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* HIGH-CONTRAST CALL TO ACTION (CTA) */}
      <section className="bg-neutral-950 text-white py-20 md:py-28 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10 space-y-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display tracking-tight max-w-2xl mx-auto leading-tight">
            Deploy Your AI Assistant in Minutes
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Join other software builders using FTChat to automate customer FAQs, reduce ticket volume, and index code documentation.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row space-y-3.5 sm:space-y-0 sm:space-x-4 justify-center">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-lg shadow-brand-600/30">
                Get Started For Free
              </Button>
            </Link>
            <Link href="/pricing" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full border-neutral-800 text-white bg-transparent hover:bg-neutral-900 hover:border-neutral-700">
                Compare Plan Details
              </Button>
            </Link>
          </div>
          <div className="pt-8 flex items-center justify-center space-x-6 text-xs text-neutral-500">
            <span className="flex items-center">
              <Check className="w-3.5 h-3.5 text-brand-500 mr-1.5" />
              Free plan, no credit card required
            </span>
            <span className="flex items-center">
              <Lock className="w-3.5 h-3.5 text-brand-500 mr-1.5" />
              Enterprise-level data security
            </span>
          </div>
        </div>
      </section>
    </>
  );
}

