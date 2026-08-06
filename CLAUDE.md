# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev`
- **Build for production**: `npm run build`
- **Start production server**: `npm run start`
- **Lint code**: `npm run lint`

## Code Architecture & Structure

### High-Level Organization

This is a Next.js 15 App Router application with TypeScript, Tailwind CSS v4, and shadcn/ui. The codebase follows Next.js App Router conventions with route groups for different sections:

- **`src/app/(marketing)`** - Public-facing marketing site (homepage, pricing, login/signup flows)
- **`src/app/(dashboard)`** - Authenticated user dashboard (overview, document management, settings)
- **`src/app/(onboarding)`** - User onboarding flow
- **`src/app/api`** - API route handlers (REST endpoints)
- **`src/components/ui`** - Reusable UI components built with shadcn/ui
- **`src/lib`** - Utility functions (currently contains `cn` utility for class merging)
- **`public`** - Static assets (favicon, etc.)

### Key Features Implemented

1. **Document Management System**
   - API routes for uploading documents (`/api/documents`)
   - Mock RAG chat functionality (`/api/chat`)
   - Document listing and metadata

2. **Multi-Tenant SaaS Architecture**
   - Route groups separating public marketing from authenticated dashboard
   - Dashboard shows usage metrics (chats, confidence, documents, satisfaction)
   - Stripe webhook integration for billing (`/api/webhooks/stripe`)

3. **AI-Powered Chat Widget**
   - Interactive chat demo on homepage showing document ingestion workflow
   - Mock RAG responses with source citations
   - Embeddable widget deployment instructions

4. **Subscription & Billing**
   - Three-tier pricing model (Starter, Pro, Enterprise)
   - Stripe integration for subscription management
   - Usage-based limits and upgrade prompts

### Development Notes from Learning Log

- **Database Design**: Multi-tenant PostgreSQL schema with Supabase, using pgvector for embeddings (1536 dimensions) and Row Level Security for tenant isolation
- **Authentication**: Supabase Auth integrated with user profiles
- **File Handling**: Document upload with background processing pipeline (to be implemented)
- **Web Crawler**: URL-based documentation ingestion (planned)
- **Styling**: Custom Tailwind v4 configuration with brand indigo palette, violet AI accents, and custom animations
- **Components**: Built with shadcn/ui using class-variance-authority and tailwind-merge for variant handling

### File Patterns to Note

- Route groups use parentheses: `(marketing)`, `(dashboard)`, `(onboarding)`
- API routes follow Next.js App Router convention: `route.ts` files in `app/api/*`
- UI components are in `src/components/ui/` following shadcn/ui structure
- Styling uses Tailwind CSS v4 with custom CSS variables defined in `globals.css`

## Getting Started

1. Install dependencies: `npm install`
2. Run development server: `npm run dev`
3. Open [http://localhost:3000](http://localhost:3000) in browser
4. For production build: `npm run build` then `npm run start`

## Testing

The project mentions Vitest for unit/integration testing and Playwright for E2E testing in the README, but test files are not yet implemented. When adding tests:
- Unit tests: Place alongside source files or in `__tests__` directories
- E2E tests: Consider using Playwright in a `tests/` or `e2e/` directory

## Environment Variables

Based on the tech stack, expect to need:
- Supabase URL and anon key
- OpenAI or Claude API key
- Stripe keys (publishable and secret)
- NextAuth/JWT secret (if used)