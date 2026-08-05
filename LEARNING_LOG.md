# AskMyDocs — SaaS Learning Log

## Week 1: Product Definition, UI/UX Design

### Day 1
- **What I built:** Defined the core strategy of AskMyDocs, mapping out the Ideal Customer Profile (ICP), three foundational user stories, the feature matrix distinguishing MVP from post-MVP phases, and a three-tier SaaS monetization model.
- **What confused me:** Reading the UTF-16LE encoded `README.md` through standard file viewing tools caused an initial mime-type issue, which required falling back to a PowerShell read.
- **What I'd do differently:** Define exact token limits for pricing tiers sooner, as having specific parameters early on will make backend limit-enforcement logic simpler to write.

### Day 2
- **What I built:** Designed the comprehensive Information Architecture (IA) for AskMyDocs, outlining the structure, routing, and key UI components for the public marketing site, authenticated dashboard, and embeddable widget.
- **What confused me:** Designing visual state mapping for the embeddable chat widget to maintain a clean layout while accommodating complex RAG-related states (like sources and handoff forms).
- **What I'd do differently:** Design the database routing patterns in tandem with the page routes, as details like the organization UUID prefix will impact dashboard layout hierarchy.

### Day 3
- **What I built:** Designed and built a fully interactive mockup (`docs/wireframes.html`) representing the low-fidelity wireframes for the dashboard home, upload documents view, and chat widget (including conversational and support handoff states).
- **What confused me:** Managing cross-component state updates (like triggering the global dashboard usage banner from a local checkbox control or updating statistics) in simple Vanilla JS without a framework.
- **What I'd do differently:** Separate client-facing widget scripts from internal admin scripts early in the mockup file structure, as unified files can grow dense quickly.

### Day 4
- **What I built:** Designed a visual identity system and configured custom theme extensions (brand indigo palette, violet AI accents, modern font stacks, and custom animations) in a workspace-level `tailwind.config.js` file.
- **What confused me:** Determining whether we should customize standard utility boundaries (like custom shadows or borders) early on or leave them as default until shadcn/ui sets them up in Day 5.
- **What I'd do differently:** Drafted CSS variable bindings for the color tokens right away to ease the transition when setting up shadcn/ui themes later.

### Day 5
- **What I built:** Scaffolded a Next.js 15 App Router application with TypeScript, Tailwind CSS v4, and shadcn/ui. Configured route group layouts (`(marketing)`, `(onboarding)`, `(dashboard)`) and API stubs (`chat`, `documents`, `crawl`, `stripe`), integrating Day 4 visual identity design tokens directly inside Tailwind v4's CSS `@theme` block.
- **What confused me:** The shadcn CLI's initial dependency verification failed due to local DNS resolution failures for `ui.shadcn.com` (ENOTFOUND). Bypassed this by writing a custom DNS resolver override preloaded via `NODE_OPTIONS` to intercept queries and target the correct Vercel IPs.
- **What I'd do differently:** Declare the `"use client";` directive at the top of forms and settings pages right away, as Next 15 build worker validation throws errors on un-escaped JSX single/double quotes and un-declared client-side event handlers during static prerendering.

### Day 6
- **What I built:** Designed and built a fully responsive high-fidelity marketing landing page for AskMyDocs featuring a sticky header, interactive mock chatbot simulator, features grid, How-It-Works interactive stepper, pricing plan toggle, and a stateful FAQ accordion.
- **What confused me:** Next.js 15 build validation checking for unescaped apostrophes (`'`) in JSX text, which resulted in compiler errors for words like `isn't` and `bot's` inside our product copy.
- **What I'd do differently:** Use HTML character entity codes (like `&apos;`) for copy blocks from the start to prevent compiler linter checks from blocking production builds.

### Day 7
- **What I built:** Designed a multi-tenant PostgreSQL database schema for AskMyDocs featuring tenant organization isolation, Supabase Auth user profile mappings, RAG document chunks with pgvector embeddings (1536 dimensions), conversational session history, and subscription usage tracking.
- **What confused me:** Weighing normalized multi-table schema patterns against RLS query latency, and deciding to denormalize `organization_id` onto child tables (`chat_messages`, `document_chunks`) so row-level policies execute without expensive multi-table joins.
- **What I'd do differently:** Define database column constraints and check enums in SQL upfront rather than relying solely on TypeScript application-level validations, ensuring data integrity at the database layer.

