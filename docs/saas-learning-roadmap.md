# Build "FTChat" — An AI Support Chatbot SaaS
### 12-Week, Day-by-Day AI Prompt Curriculum
Stack: Next.js (App Router) + Supabase (Postgres + pgvector + Auth + Storage) + Stripe + OpenAI/Claude API

---

## How to use this

Each day = one prompt. Paste it into your AI coding agent (Claude Code, Cursor, etc.) inside your project repo.
Rules to actually learn (not just copy-paste):
1. Before running the prompt, **read the AI's plan** and ask it to explain any file/concept you don't understand.
2. After each day, write 3 sentences in a `LEARNING_LOG.md`: what you built, what confused you, what you'd do differently.
3. Commit to git at the end of every day — this becomes your portfolio history.
4. If a day's prompt fails or the app breaks, the debugging *is* the lesson — don't skip to the next day until it works.

---

## Week 1 — Product Definition, UI/UX Design

**Day 1**
> Act as a senior product designer. I'm building a SaaS called FTChat — businesses upload their docs/FAQs and get an embeddable AI chat widget that answers customer questions from that content. Help me define: target customer, 3 core user stories, MVP feature list vs "later" features, and a simple monetization model (free/pro/business tiers).

**Day 2**
> Based on yesterday's MVP scope, design the information architecture: list every page/screen needed (marketing site + authenticated dashboard + embeddable widget), and for each, its purpose and key UI elements.

**Day 3**
> Create low-fidelity wireframes (describe in text + ASCII layout, or generate as an HTML mockup) for: the dashboard home, the "upload documents" screen, and the chat widget itself.

**Day 4**
> Design a simple visual identity: color palette, typography choices, and component style (rounded/sharp, spacing scale) for a professional B2B SaaS feel. Generate a Tailwind config with these design tokens.

**Day 5**
> Scaffold a new Next.js 15 App Router project with TypeScript, Tailwind, and shadcn/ui. Set up the folder structure for a SaaS app (marketing routes, dashboard routes, api routes, lib/, components/).

**Day 6**
> Build the marketing landing page (hero, features, pricing preview, CTA) using the design tokens from Day 4. Make it fully responsive.

---

## Week 2 — Database Design & Auth

**Day 7**
> Act as a database architect. Design a multi-tenant Postgres schema for FTChat: organizations, users, documents, document_chunks (with vector embeddings), chat_sessions, chat_messages, and usage/plan tracking. Explain your normalization and indexing choices.

**Day 8**
> Set up Supabase locally, enable the pgvector extension, and write the SQL migrations for the schema we designed. Include Row Level Security (RLS) policies so each organization can only see its own data.

**Day 9**
> Implement Supabase Auth in Next.js: email/password + Google OAuth sign-up/login, protected dashboard routes, and a middleware that redirects unauthenticated users.

**Day 10**
> Add an "organization" concept: when a user signs up, auto-create an organization and make them the owner. Build a basic team invite flow (invite by email, roles: owner/admin/member).

**Day 11**
> Write a seed script that populates the local Supabase DB with sample organizations, users, and documents for testing.

**Day 12**
> Explain and implement RLS testing: write a script or test suite that verifies User A cannot read User B's organization data, even via direct API calls.

---

## Week 3 — Core CRUD & File Handling

**Day 13**
> Build the "Documents" dashboard page: list uploaded documents with status (processing/ready/failed), upload button, delete action.

**Day 14**
> Implement file upload to Supabase Storage (PDF, .txt, .md, .docx support) with a progress indicator and file size/type validation.

**Day 15**
> Build a background processing pipeline: extract text from uploaded files (PDF/docx parsing), chunk the text intelligently (explain chunking strategy tradeoffs), and store chunks in the DB.

**Day 16**
> Add a simple website URL crawler feature: user pastes a URL, we scrape and chunk the page content the same way as uploaded docs.

**Day 17**
> Build organization settings page: rename org, manage plan/billing info placeholder, manage team members, delete organization (with confirmation + cascading delete).

**Day 18**
> Review everything built so far for security holes: SQL injection, unrestricted file upload types, missing auth checks on API routes. Fix what you find and explain each vulnerability.

---

## Week 4 — AI Integration Part 1: Embeddings & RAG

**Day 19**
> Explain how RAG (Retrieval-Augmented Generation) works and how it applies to FTChat. Then implement an embedding pipeline: generate embeddings for each document chunk using an embeddings model and store them in pgvector.

**Day 20**
> Implement semantic search: given a user question, generate its embedding and retrieve the top-k most relevant chunks using pgvector similarity search. Test it manually with sample queries.

**Day 21**
> Build the RAG chat endpoint: retrieve relevant chunks, construct a prompt with context + guardrails ("only answer from provided context, say you don't know otherwise"), call the LLM, and return the answer with cited sources.

**Day 22**
> Convert the chat endpoint to streaming responses (Server-Sent Events or streaming API) so answers appear token-by-token in the UI.

**Day 23**
> Build the actual embeddable chat widget: a standalone JS snippet + iframe or web component that any external website can embed with a single script tag, connecting to our chat API.

**Day 24**
> Add conversation memory: store chat_sessions and chat_messages so the widget maintains context across a multi-turn conversation, and show chat history in the dashboard for the business owner to review.

---

## Week 5 — AI Integration Part 2: Workflow & UX Intelligence

**Day 25**
> Add an AI-powered "auto-tag & categorize" workflow: when a new chat conversation ends, use an LLM call to classify its topic/sentiment and flag conversations where the AI couldn't answer confidently.

**Day 26**
> Build an "AI suggests missing content" feature: analyze unanswered/low-confidence questions over time and surface a dashboard widget suggesting what documentation gaps to fill.

**Day 27**
> Implement a human handoff workflow: if the AI is unsure, let the widget offer "talk to a human" which creates a support ticket/notification for the org's team (email or in-app).

**Day 28**
> Add configurable AI behavior per organization: tone (formal/friendly), custom system prompt additions, and a "test your bot" playground in the dashboard before it goes live.

**Day 29**
> Optimize for UX: add typing indicators, suggested starter questions, feedback buttons (thumbs up/down) on AI answers, and store that feedback for future model tuning.

**Day 30**
> Review the AI system end-to-end for cost and latency. Add response caching for repeated questions and explain a strategy to control LLM API costs at scale.

---

## Week 6 — Payments & Billing (Stripe)

**Day 31**
> Explain Stripe's subscription model (Products, Prices, Customers, Subscriptions, Webhooks) as it applies to our free/pro/business tiers. Set up Stripe in test mode with these products.

**Day 32**
> Build the pricing page with plan comparison and implement Stripe Checkout for upgrading from free to a paid plan.

**Day 33**
> Implement Stripe webhooks: handle subscription created/updated/cancelled events and sync plan status into our organizations table securely (verify webhook signatures).

**Day 34**
> Add usage-based limits per plan (e.g., number of documents, number of chat messages/month). Build middleware that checks and enforces these limits, and a dashboard usage meter.

**Day 35**
> Build the customer billing portal integration (Stripe Customer Portal) so users can update payment methods, view invoices, and cancel/downgrade themselves.

**Day 36**
> Write test cases (using Stripe's test mode + test clocks) for: successful subscription, failed payment, subscription cancellation, and plan downgrade — confirm our app state stays correct in every case.

---

## Week 7 — Testing Part 1: Unit & Integration

**Day 37**
> Set up a testing framework (Vitest or Jest) for this project. Write unit tests for the text chunking logic and the plan/usage-limit enforcement logic.

**Day 38**
> Write unit tests for the RAG retrieval function (mock the embeddings/LLM calls) to verify it correctly ranks and returns relevant chunks.

**Day 39**
> Write integration tests for the API routes: document upload, chat endpoint, and org creation — using a test Supabase instance or mocked DB.

**Day 40**
> Write integration tests for the Stripe webhook handler using Stripe's official test event payloads.

**Day 41**
> Set up test coverage reporting and identify the top 5 undertested critical paths in the app; write tests for them.

**Day 42**
> Add CI (GitHub Actions) that runs lint, type-check, and the full test suite on every push/PR.

---

## Week 8 — Testing Part 2: E2E, Security, Performance

**Day 43**
> Set up Playwright for end-to-end testing. Write an E2E test for the full signup → create org → upload document → chat flow.

**Day 44**
> Write an E2E test for the Stripe checkout upgrade flow using Stripe test cards.

**Day 45**
> Perform a security audit: test for auth bypass on protected routes, RLS bypass attempts, XSS in the chat widget (since it renders on third-party sites), and CSRF on state-changing endpoints. Fix findings.

**Day 46**
> Add rate limiting to public-facing endpoints (chat widget API, auth endpoints) to prevent abuse and cost blowouts.

**Day 47**
> Run a load test (e.g., k6 or Artillery) simulating concurrent chat widget users. Identify bottlenecks (DB connections, LLM API concurrency) and fix them.

**Day 48**
> Do an accessibility (a11y) audit of the dashboard and widget using axe or Lighthouse; fix contrast, keyboard nav, and screen-reader issues.

---

## Week 9 — Production Readiness & DevOps

**Day 49**
> Set up environment configs for local/staging/production, and a secrets management strategy (never commit keys). Document the full .env.example.

**Day 50**
> Set up error monitoring (Sentry) and structured logging across the API routes and background jobs.

**Day 51**
> Add application analytics (PostHog or similar) to track key funnel events: signup, first document upload, first chat, upgrade to paid.

**Day 52**
> Set up a staging environment on Vercel/hosting provider connected to a separate Supabase project, and a deployment checklist.

**Day 53**
> Write a database backup and disaster recovery plan; test restoring from a backup in staging.

**Day 54**
> Do a production launch checklist review: SSL, custom domain, SEO meta tags, sitemap/robots.txt, legal pages (privacy policy, terms), and GDPR-style data deletion for a user/org.

---

## Week 10 — Multi-Tenancy Hardening & Polish

**Day 55**
> Stress-test multi-tenancy: create 5 fake orgs with overlapping data and verify total isolation across every feature (documents, chats, billing, analytics).

**Day 56**
> Add an admin/superadmin view (for you, the SaaS owner) to see all orgs, usage, and revenue — with strict access control.

**Day 57**
> Improve onboarding: add a guided first-run experience (empty states, sample document option, "invite your team" nudge).

**Day 58**
> Add email notifications (via Resend/Postmark): welcome email, usage limit warning, failed payment, weekly digest of chat activity.

**Day 59**
> Polish the widget's customization options: colors, position, avatar, welcome message — configurable per org and previewable live.

**Day 60**
> Do a full UX pass: reduce friction in the top 3 user flows, add loading/empty/error states everywhere, and test the whole product on mobile.

---

## Week 11 — Go-to-Market Features

**Day 61**
> Add a public status page and changelog for the product.

**Day 62**
> Build a simple affiliate/referral system: unique referral links, tracking, and reward logic.

**Day 63**
> Add an API for customers who want programmatic access (create documents, fetch chat analytics) with API key management.

**Day 64**
> Write developer-facing docs for the widget embed and the API, and generate an OpenAPI spec.

**Day 65**
> Add SEO content infrastructure: blog section, structured data, and a few example posts targeting your ICP's search terms.

**Day 66**
> Do a competitive analysis workflow: have the agent summarize 3 competitor products' pricing/features (you provide the research) and suggest differentiation.

---

## Week 12 — Final Hardening, Launch & Retro

**Day 67**
> Run a final full regression: re-run entire test suite, E2E suite, and manually walk every core flow as a new user, a returning user, and an admin.

**Day 68**
> Do a cost audit: estimate LLM + infra costs per active org at each plan tier, and verify your pricing has healthy margins.

**Day 69**
> Prepare a soft-launch plan: where to post (Product Hunt, relevant communities), a demo video script, and a feedback collection mechanism (in-app widget or form).

**Day 70**
> Set up basic customer support tooling: a shared inbox or ticket view for incoming user questions/bugs.

**Day 71**
> Write a 90-day post-launch roadmap based on what's still "later" from Day 1's feature list, prioritized by expected impact.

**Day 72**
> Retro day: review your LEARNING_LOG.md from the whole 12 weeks. Ask the agent to quiz you on the concepts you found hardest (RLS, RAG, Stripe webhooks, E2E testing) to confirm you actually understand them, not just that the code works.

---

## Tips for maximizing learning

- **Don't let the agent run silently.** Ask "explain what you just did and why" after any non-trivial step.
- **Break things on purpose** sometimes (delete an RLS policy, remove a test) to see what fails and why — that's where real understanding comes from.
- **Re-explain each week's core concept** in your own words in the learning log before moving to the next week.
- If a day feels too easy or too hard for your pace, it's fine to split one day into two, or merge two light days — the sequence matters more than the exact daily boundary.
