# AskMyDocs — Product Definition & Strategy

This document details the product design decisions for AskMyDocs, established on Day 1 of the SaaS learning roadmap.

---

## 1. Target Customer (Ideal Customer Profile)

AskMyDocs targets **Small and Medium Businesses (SMBs), customer support leads, and technical founders** who:
- Receive a high volume of repetitive customer support inquiries (e.g., pricing, installation, basic troubleshooting).
- Have limited human support bandwidth, resulting in delayed response times or high support costs.
- Already maintain some documentation, FAQ lists, markdown guides, or public-facing knowledge bases.

**Primary Industries:**
- **B2B SaaS / Startups:** Need 24/7 technical and product FAQs answered.
- **E-Commerce:** Need instant answers about order policies, shipping, and returns.
- **Digital Agencies:** Need a simple way to offer support widgets to their clients.

---

## 2. Core User Stories

We focus on three primary user journeys covering the setup, usage, and optimization of the chatbot:

### User Story 1: Setup & Ingestion (The Business Admin)
> **As a** startup support lead,
> **I want to** upload our company's product documentation (PDF, TXT, MD format) into AskMyDocs,
> **So that** the AI has a source of truth to answer incoming customer support questions accurately.

### User Story 2: Instant Customer Support (The End Customer)
> **As a** prospective customer visiting the business's website,
> **I want to** type a question into the floating chat widget and receive a quick, natural answer citing the source document,
> **So that** I can get immediate help without submitting a support ticket or waiting for a human agent.

### User Story 3: Quality Improvement (The Business Admin)
> **As a** support lead,
> **I want to** review the dashboard log of customer chats and view questions the AI couldn't answer or answered with low confidence,
> **So that** I can identify gaps in our current documentation and update it.

---

## 3. Feature Scope: MVP vs. Future Rollout

To ensure we launch quickly and learn from actual usage, we divide our features into an initial MVP and post-launch phases.

| Feature Area | MVP Scope (Weeks 1 - 6) | Post-MVP / Later Scope (Weeks 10 - 12) |
| :--- | :--- | :--- |
| **Authentication & Orgs** | Email/Password & Google Auth, simple multi-tenant Organization creation, Owner/Member roles. | Advanced team management (fine-grained RBAC), SAML/SSO. |
| **Data Ingestion** | File uploads (PDF, TXT, MD, DOCX) up to 10MB, manual text chunking. | Public website crawler (URL scraping), automated sync with Notion/Google Docs. |
| **AI Widget** | Standard floating chat widget embedded via a single `<script>` snippet or iframe. | Customizable widget styles (themes, custom CSS), custom starter questions, dynamic typing indicators. |
| **RAG & Engine** | Semantic search using pgvector, basic LLM prompting with source citations. | Multi-language support, custom LLM selection, hybrid search (keyword + semantic). |
| **Billing & Limits** | Stripe subscriptions, usage checking (documents uploaded, chats/month limit). | Metered billing (pay-per-query), invoice downloads, usage alert notifications. |
| **Analytics & Insights** | Chat logs history list, basic conversation review. | Automated tag classification, low-confidence unanswered queries report, sentiment tracking. |

---

## 4. Monetization Model

We utilize a three-tier monthly subscription model designed around usage limits (storage/documents and chat volume) and branding customization.

### **Free Tier ($0/month)**
*Designed for trial, testing, and tiny projects.*
- **Organizations/Bots:** 1 organization, 1 active bot.
- **Knowledge Base:** Max 3 files uploaded (up to 2MB total).
- **Usage Limits:** 50 chat messages/month.
- **Branding:** Non-removable "Powered by AskMyDocs" badge.
- **Support:** Community/Self-serve.

### **Pro Tier ($29/month)**
*Designed for growing startups and active SMBs.*
- **Organizations/Bots:** 1 organization, 3 active bots.
- **Knowledge Base:** Max 50 files uploaded (up to 50MB total).
- **Usage Limits:** 1,500 chat messages/month.
- **Branding:** Removable "Powered by AskMyDocs" badge (White-labeled).
- **Support:** Next-day email support.

### **Business Tier ($99/month)**
*Designed for established companies requiring scale and deeper integration.*
- **Organizations/Bots:** 1 organization, Unlimited active bots.
- **Knowledge Base:** Max 500 files uploaded (up to 500MB total) + Website URL crawler.
- **Usage Limits:** 10,000 chat messages/month.
- **AI Customization:** Custom system prompt adjustment, tone selection.
- **Features:** Human handoff / email ticket routing, shared team inbox.
- **Support:** Priority (under 4h) email support.
