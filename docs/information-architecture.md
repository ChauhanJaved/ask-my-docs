# AskMyDocs — Information Architecture & Sitemap

This document maps out the Information Architecture (IA) for AskMyDocs, detailing the pages, routing, layouts, and key UI components for the marketing site, user dashboard, and chat widget.

---

## 1. Information Architecture Overview

Here is the sitemap and primary user flow navigation structure for AskMyDocs:

```mermaid
graph TD
    %% Public Pages
    subgraph Public Site [Public Marketing Website]
        Home["Home (Landing Page)"]
        Pricing["Pricing Page"]
        Login["Login Page"]
        SignUp["Sign Up Page"]
    end

    %% Authenticated Dashboard
    subgraph Dashboard [Authenticated Dashboard]
        Onboarding["Onboarding Wizard"]
        Overview["Dashboard Overview (/dashboard)"]
        Docs["Documents Management (/dashboard/documents)"]
        WidgetConfig["Widget Configurator (/dashboard/settings/widget)"]
        ChatLogs["Chat Logs & History (/dashboard/chats)"]
        TeamSettings["Team Settings (/dashboard/settings/team)"]
        BillingSettings["Billing Settings (/dashboard/settings/billing)"]
    end

    %% Embeddable Chat Widget
    subgraph Widget [Embedded Widget on Client Site]
        Launcher["Minimized Launcher (Bubble)"]
        ChatWindow["Chat Window (Messages/Citations)"]
        Handoff["Handoff Form (Contact Support)"]
    end

    %% Navigations & Flows
    Home --> Pricing
    Home --> Login
    Home --> SignUp
    SignUp --> Onboarding
    Onboarding --> Overview
    
    Overview --> Docs
    Overview --> WidgetConfig
    Overview --> ChatLogs
    Overview --> TeamSettings
    Overview --> BillingSettings
    
    Launcher --> ChatWindow
    ChatWindow --> Handoff
```

---

## 2. Public Marketing Site (Unauthenticated)

These pages are accessible publicly and designed to educate visitors, present the product's benefits, and convert them to registered users.

### 2.1. Home Page (`/`)
* **Purpose:** Introduce the product, explain its core value proposition (turn documentation into an instant support agent), show how it works, and direct users to register.
* **Key UI Elements:**
  * **Navigation Bar:** Brand Logo, Features link, Pricing link, Log In button, "Get Started" (primary CTA).
  * **Hero Section:** High-impact heading, sub-headline, and double CTAs ("Start Free Trial", "Watch Demo").
  * **Interactive Demo Preview:** A live sandbox where visitors can ask questions to a mock bot to experience the widget responsiveness first-hand.
  * **How It Works (3-Step Flow):**
    1. Upload documents or paste website links.
    2. Test and customize the AI bot appearance/tone.
    3. Copy the `<script>` tag to your website.
  * **Features Grid:** Key value cards outlining pgvector semantic search, source citations, human handoff, and multi-tenant safety.
  * **Pricing Highlight / Calculator:** Quick visual slider showing cost benefit vs. hiring human customer service agents.
  * **Footer:** Newsletter subscription field, links to documentation, social profiles, terms, and privacy policy.

### 2.2. Pricing Page (`/pricing`)
* **Purpose:** Details the pricing models (Free, Pro, Business) and features per tier to encourage checkout.
* **Key UI Elements:**
  * **Billing Interval Toggle:** Monthly vs. Annual toggle (showing a discount tag).
  * **Three Tier Cards:**
    * *Free:* Standard features, limits, "Start Free" CTA.
    * *Pro:* Key highlight shadow, "Upgrade to Pro" highlighted CTA.
    * *Business:* Detailed scaling info, "Upgrade to Business" CTA.
  * **Feature Comparison Table:** Exhaustive list of limits (files, bots, message volumes, custom system prompt adjustments).
  * **FAQ Accordion:** Answers to common pre-purchase questions (billing, file format limits, custom LLMs, cancellation).

### 2.3. Authentication Pages (`/login`, `/signup`, `/reset-password`)
* **Purpose:** Fast and secure user onboarding and sign-in.
* **Key UI Elements:**
  * **Auth Card Header:** Company Logo, form title.
  * **Social Logins:** "Continue with Google" OAuth button.
  * **Credential Form:** Email input, Password input, Password validation indicators (on signup), Password recovery link (on login).
  * **Context Switcher:** "Already have an account? Log In" or "New to AskMyDocs? Sign Up".

---

## 3. Authenticated Dashboard (Multi-Tenant)

The dashboard is the central hub where organization admins manage their data, customize their chatbot widget, audit conversation logs, and handle payments.

| Route | Page Name | Primary Objective |
| :--- | :--- | :--- |
| `/dashboard/onboarding` | Onboarding Wizard | Guide new organizations through initial setup. |
| `/dashboard` | Overview | Show account health metrics, usage limits, and recent activity. |
| `/dashboard/documents` | Documents | Upload, crawl, and manage knowledge-base files. |
| `/dashboard/settings/widget`| Widget Customization | Visually style the bot and copy embed scripts. |
| `/dashboard/chats` | Chat Logs & Analytics | Review past chats, flag unanswered queries, check ratings. |
| `/dashboard/settings/team` | Team Settings | Manage team members, roles, and pending invites. |
| `/dashboard/settings/billing`| Billing | Check usage quotas, choose plan, redirect to Stripe Portal. |

### 3.1. Onboarding Flow (`/dashboard/onboarding`)
* **Purpose:** Give users an immediate "Aha!" moment on signup by prompting them to build their first bot.
* **Key UI Elements:**
  * **Stepped Progress Bar:** Visual indicators for current setup stage.
  * **Step 1 (Organization Details):** Org/Company name input field.
  * **Step 2 (Data Ingest):** Drag-and-drop file upload zone (TXT, MD, PDF) to create their first knowledge source.
  * **Step 3 (Success & Code):** Instant display of the HTML copy-paste code snippet + "Go to Dashboard" CTA.

### 3.2. Dashboard Overview (`/dashboard`)
* **Purpose:** Provide a high-level command view of system performance and current resource usage.
* **Key UI Elements:**
  * **Primary Sidebar Navigation:** Links to Dashboard, Documents, Chats, Widget Config, Team, and Billing. Includes a tenant selector dropdown if a user belongs to multiple organizations.
  * **Key Metrics Strip:** 
    * Total Chats (Current Month)
    * Average Confidence Score (AI responses)
    * Active/Total Documents
    * User Satisfaction Rate (% thumbs up)
  * **Usage Limit Visual Meters:** High-visibility progress bars mapping:
    * Files uploaded (e.g., 2 / 3 files used on Free tier)
    * Message volume (e.g., 12 / 50 chats used this month)
    * *Upgrade warning Banner:* Triggered when usage exceeds 80% of current tier capacity.
  * **Recent Chat Activity:** Short chronological feed of the latest customer chats with status tags (*Completed*, *Unanswered*, *Flagged*).

### 3.3. Documents Management (`/dashboard/documents`)
* **Purpose:** Add, process, and delete files that populate the database embeddings.
* **Key UI Elements:**
  * **Ingest Section:**
    * File Upload Dropzone: Visual area supporting dragging of PDF, TXT, MD, DOCX (up to 10MB).
    * Web Crawler Card (Pro/Business): URL input text box, recursion depth selector, and "Scrape Site" button.
  * **Documents Table:**
    * *Columns:* File Name, Type icon, Date Ingested, File Size, Processing Status (`Processing`, `Ready`, `Failed`).
    * *Actions:* "View Source Chunks" (modal showing split texts), "Delete File" (trash icon with confirmation dialog).

### 3.4. Widget Configurator & Styling (`/dashboard/settings/widget`)
* **Purpose:** Customise the visual design and system prompts of the embeddable bot, and generate integration snippets.
* **Key UI Elements:**
  * **Visual Customizer panel (Left Column):**
    * Chatbot Name & Avatar upload zone.
    * Theme Theme/Accent Color selection (HEX inputs / Color Picker).
    * Welcome message text area.
    * System Prompt Overrides (Business Tier): Custom system instruction rules.
    * Agent tone slider (Formal <--> Friendly).
  * **Widget Live Preview (Center/Right Column):**
    * A mock webpage displaying the chat widget reflecting design changes in real-time.
  * **Integration Snippet Card:**
    * A copyable text box containing the `<script>` tag loader containing the client org ID (e.g., `<script src="https://widget.askmydocs.com/loader.js" data-org-id="12345"></script>`).

### 3.5. Chat Logs & Analytics (`/dashboard/chats`)
* **Purpose:** Audit AI conversational quality, examine citations, and discover document coverage gaps.
* **Key UI Elements:**
  * **Left Panel (Chats List):** Search bar, date range filters, flag filters (All, Low-Confidence, Unanswered). List elements showing time, length, and rating (Thumbs Up/Down).
  * **Center Panel (Thread Transcript):**
    * Scrollable thread view showing conversation between Customer and Bot.
    * Citations/References highlighted inline (hovering shows exact document snippet).
    * Rating details (if customer left a note with thumbs-down).
    * Action bar: "Export Chat", "Convert to Support Ticket" (manually trigger email forwarding).

### 3.6. Team Settings (`/dashboard/settings/team`)
* **Purpose:** Manage administrative permissions inside the workspace.
* **Key UI Elements:**
  * **Add Team Member Form:** Email address input, role select dropdown (`Member`, `Admin`), "Send Invitation" action.
  * **Pending Invites List:** Displays email, invitation link, role, and "Revoke" button.
  * **Team Roster Table:** List of current members showing name, avatar, email, assigned role, and edit/delete permissions (restricted to Owner).

### 3.7. Billing Settings (`/dashboard/settings/billing`)
* **Purpose:** Manage active subscriptions and resource quota extensions.
* **Key UI Elements:**
  * **Plan Card:** Current plan name, cost, renewal date.
  * **Upgrade Section:** Displays tier options for fast upgrade checkout paths.
  * **Stripe Billing Portal Button:** Direct, secure link redirecting to the organization's Stripe invoices page to modify credit cards or cancel subscriptions.

---

## 4. Embeddable Chat Widget (Client-Facing)

The widget is loaded via an iframe or web component dynamically on the client's site. It must be highly performant, accessible, and responsive.

### 4.1. State 1: Minimized Launcher
* **Purpose:** Rest at the bottom-right of the site without obstructing content.
* **Key UI Elements:**
  * Icon button (Chat bubble, customizable avatar).
  * Hover tooltip (e.g., "Ask our docs!").
  * Pulse indicator / Unread badge.

### 4.2. State 2: Main Chat Window (Opened)
* **Purpose:** Serve as the conversation interface.
* **Key UI Elements:**
  * **Header:** Bot profile photo/avatar, Bot Name, custom subtitle (e.g., "AI Assistant"), Close (minimize) button.
  * **Conversational Feed:**
    * Messages grouped chronologically with automated scrolling.
    * Typing Indicator: Simple three-dot pulse animation when RAG pipeline is processing responses.
    * Suggested starter questions (Quick-reply pills for FAQs).
    * Markdown formatting support for tables, lists, and code blocks inside AI answers.
    * Hoverable citation numbers (e.g., `[1]`, `[2]`) that open popup bubbles with the exact excerpt source document title.
  * **Footer:**
    * Textarea field with "Press Enter to Send".
    * Send Button (Paper-airplane icon).
    * Whitelabel signature: Small "Powered by AskMyDocs" link (removed on Pro/Business tiers).

### 4.3. State 3: Handoff / Contact Support Form
* **Purpose:** Capture user details and query for human escalation when the AI hits a confidence threshold limit.
* **Key UI Elements:**
  * **Form Prompt Header:** "Our AI couldn't find the exact answer. Let us forward this to our support team."
  * **Input Fields:** User Name, User Email, Message (pre-populated with original query).
  * **Submit Button:** Send to organization inbox.
  * **Success Message:** "Thank you! Our support team has received your query and will contact you at your email shortly."
