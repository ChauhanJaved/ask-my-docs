# FTChat

FTChat is an AI-powered support assistant that lets businesses turn their
existing documentation, FAQs, and knowledge base content into an embeddable
chat widget for their website. It uses retrieval-augmented generation (RAG)
to answer customer questions accurately from a business's own content, with
built-in analytics, human handoff, and usage-based billing.

## Features

- **Document ingestion** - upload PDFs, docs, or crawl website URLs
- **AI chat widget** - embeddable on any site via a single script tag
- **RAG-based answers** - responses grounded in the customer's own content, with source citations
- **Team & organization management** - multi-tenant with role-based access
- **Usage analytics** - conversation history, unanswered-question insights, feedback tracking
- **Subscription billing** - tiered plans via Stripe, usage-based limits

## Tech Stack

- **Frontend/Backend:** Next.js (App Router), TypeScript, Tailwind CSS (v4)
- **Database & Auth:** Supabase (Postgres, pgvector, Row Level Security)
- **Payments:** Stripe (Subscriptions, Webhooks, Customer Portal)
- **AI:** OpenAI/Claude for embeddings and chat completion
- **Testing:** Vitest (unit/integration), Playwright (E2E)

## Getting Started

To run the Next.js web application locally, follow these steps:

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the results.

### 3. Build for Production

```bash
npm run build
```

## Status

In active development - see `LEARNING_LOG.md` for build progress and
`docs/saas-learning-roadmap.md` for the full development plan.
