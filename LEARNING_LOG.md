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

