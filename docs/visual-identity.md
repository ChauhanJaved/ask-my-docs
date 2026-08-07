# FTChat — Visual Identity & Design System

This document outlines the visual identity, brand values, design tokens, and style choices for **FTChat**. 

---

## 1. Brand Essence & Pillars
- **Trust & Reliability**: Deep Indigo and clean Slate tones project security, stability, and corporate readiness.
- **Intelligent Simplicity**: A glowing Violet/Purple accent represents our AI capabilities (smart assistance) without overwhelming the workspace.
- **High Clarity**: Clear typography hierarchies, ample whitespace, and strict contrast ratios ensure dashboard readability and a distraction-free user widget.

---

## 2. Color Palette (Design Tokens)

All colors are designed to map smoothly to Tailwind's palette naming conventions, facilitating light and dark mode styling.

### Brand / Primary
*Used for core branding, main navigation, links, and heavy-contrast action buttons.*
- **`brand-50`**: `#EEF2FF` — Very light tint (background hover)
- **`brand-100`**: `#E0E7FF` — Soft highlight
- **`brand-500`**: `#6366F1` — Brand Primary (indigo base)
- **`brand-600`**: `#4F46E5` — Primary Hover / Interactive
- **`brand-700`**: `#4338CA` — Active State / Press
- **`brand-900`**: `#312E81` — Deep brand color (dark theme elements)

### AI Accent / Assistant
*Used specifically for AI-generated messages, AI statuses, tooltips, and floating chat action widgets.*
- **`ai-accent-50`**: `#F5F3FF` — Light violet backdrop
- **`ai-accent-500`**: `#8B5CF6` — AI theme primary
- **`ai-accent-600`**: `#7C3AED` — AI interactive hover
- **`ai-accent-700`**: `#6D28D9` — Selected indicators

### Neutral / Grays (Slate/Zinc blend)
*Maintains clean layout separation, readable paragraph text, and modern border colors.*
- **`neutral-50`**: `#F9FAFB` (Base light page background)
- **`neutral-100`**: `#F3F4F6` (Card background light)
- **`neutral-200`**: `#E5E7EB` (Light mode borders)
- **`neutral-500`**: `#6B7280` (Muted captions, secondary labels)
- **`neutral-800`**: `#1F2937` (Dark mode card background)
- **`neutral-900`**: `#111827` (Base text color in light / page background in dark)

### Feedback & Statuses
- **Success** (Upload complete, payment verified): Emerald (`#10B981`)
- **Warning** (Plan usage limit at 80%): Amber (`#F59E0B`)
- **Destructive** (Delete document, cancel subscription): Rose (`#F43F5E`)

---

## 3. Typography & Text Hierarchy

We use a dual-font stack for an elevated professional feel:
- **Headings & Callouts**: **Plus Jakarta Sans** (clean, geometric, tech-forward).
- **Body & Controls**: **Inter** (neutral, extremely legible at small sizes).
- **Code & Raw Previews**: **JetBrains Mono** or system-mono (for tabular data, logs, API keys).

### Spacing Scale
Following Tailwind's default 4px/8px standard scale:
- `rem` base (`16px`)
- Card paddings: `1.5rem` (`24px` / `p-6`)
- Small item padding: `0.75rem` (`12px` / `p-3`) or `0.5rem` (`8px` / `p-2`)
- Input gap sizes: `1rem` (`16px` / `gap-4`)

---

## 4. Component Styles & Border Radii

We balance rounded friendlier interfaces with clean structured grids:
- **Buttons / Core Inputs**: `0.375rem` (`6px` / `rounded-md`) — sharp, professional standard.
- **Dashboard Cards / Sidebars**: `0.5rem` (`8px` / `rounded-lg`) — subtle separation.
- **Chat Bubbles & Widget Container**: `1rem` (`16px` / `rounded-2xl`) — friendly conversational containers.
- **Avatars & Floating Chat Action (FAB)**: `9999px` (`rounded-full`).

---

## 5. Micro-Animations & Transitions

Smooth transitions make the interface feel responsive and responsive:
- **Hover Transitions**: Standard `all 150ms cubic-bezier(0.4, 0, 0.2, 1)` transition for buttons, cards, and list items.
- **Chat Bubble Pop**: A subtle scaling slide-in for incoming AI messages:
  `@keyframes slide-up-fade { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }`
- **Typing Indicator**: A repeating soft pulse animation on three dots:
  `@keyframes bounce-delay { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }`
