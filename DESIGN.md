# Vicharanashala (विचारशाला) — FAQ Section Design Blueprint & Prompt Spec

This document serves as a detailed prompt and design specification for creating and improving the **FAQ Section** of the Vicharanashala (विचारशाला) community-driven FAQ platform. It focuses exclusively on the FAQ layout, interactions, styling, and data presentation based on the organization's rules and structure in `FAQ.txt`.

---

## 🎨 1. Brand Theme & Aesthetics (Vicharanashala)

- **Organization Theme**: Applied AI, Open-Source Software Engineering, and Educational Design at the VLED Lab, IIT Ropar.
- **Aesthetic Tone**: **Corporate Modern with Tactile Softness**. A balance of academic authority (IIT Ropar) and modern developer tool utility.
- **Core Palette** (Aligned with Tailwind configurations):
  - **Primary / Accent (Vibrant Coral)**: `#ff5c35` / `#b52701`. Used for focus outlines, active accordion states, and critical notification highlights.
  - **Secondary (Muted Charcoal)**: `#5f5e5e` / `#656464`. Used for category labels, tags, and secondary action tools.
  - **Tertiary (Intellectual Indigo)**: `#494bd6` / `#8386ff`. Represents official validation badges, search keyword highlights, and verified checkmarks.
  - **Surfaces**: `#ffffff` cards sitting on a `#f8f9fa` neutral canvas.
- **Typography**: **Plus Jakarta Sans**. Large headlines use tight tracking for an architectural geometric look; body copies have a high line-height (`1.6`) for clear reading of detailed FAQ text.

---

## 📐 2. Layout Structure: The Double-Column Interactive Portal

Instead of a generic grid layout, the improved FAQ interface uses a responsive **Double-Column Portal** structured as follows:

```
┌────────────────────────────────────────────────────────────────────────┐
│  🔍 Search Bar: Input query or select quick tags                      │
├──────────────────────────────────────┬─────────────────────────────────┤
│                                      │                                 │
│  COLUMN 1: Category Filter Panel     │  COLUMN 2: Collapsible Accordion│
│                                      │  Feed (List of FAQs)            │
│  [🔍 Category Search]                │                                 │
│                                      │  ┌───────────────────────────┐  │
│  ■ 1. About the Internship [12]      │  │ 📂 About the Internship   │  │
│  ■ 2. Timing & Dates       [8]       │  │ Q: What is the VINS... ?  │  │
│  ■ 3. NOC & Documentation  [15]      │  │ [Official Verification]   │  │
│  ■ 4. Selection & Offer    [11]      │  │ [Markdown Answer Text]    │  │
│  ■ 5. Work & Mentorship    [9]       │  │ ▲ 42 votes | 🔗 Share     │  │
│  ■ 6. Rosetta Journal      [14]      │  └───────────────────────────┘  │
│  ■ 7. ViBe LMS Platform    [26]      │  ┌───────────────────────────┐  │
│  ■ 8. Spurti Points (SP)   [10]      │  │ Q: How long is the... ?   │  │
│  ■ 9. Teams & Support      [15]      │  └───────────────────────────┘  │
│                                      │                                 │
└──────────────────────────────────────┴─────────────────────────────────┘
```

### 📁 A. Left Column: Sticky Category Navigation & Quick Filters
- **Interactive Menu**: A sidebar layout that lists the 9 key organizational folders from `FAQ.txt`:
  1. **About the Internship** (Icon: `info`, Color: `#494bd6`)
  2. **Timing & Dates** (Icon: `schedule`, Color: `#b52701`)
  3. **NOC & Documentation** (Icon: `description`, Color: `#ff5c35`)
  4. **Selection & Offer Letter** (Icon: `verified`, Color: `#494bd6`)
  5. **Work, Mentorship, & Projects** (Icon: `terminal`, Color: `#5f5e5e`)
  6. **Rosetta Journal** (Icon: `menu_book`, Color: `#ff5c35`)
  7. **ViBe LMS Platform** (Icon: `school`, Color: `#494bd6`)
  8. **Spurti Points (SP)** (Icon: `military_tech`, Color: `#ba1a1a`)
  9. **Teams & Support** (Icon: `groups`, Color: `#5f5e5e`)
- **Visual Enhancements**:
  - Color indicator matching each category's custom color theme.
  - Denormalized question count indicators (e.g. `[15]`) to guide the user.
  - Auto-suggest keyword tags above categories (e.g. `"WSL terminal"`, `"Zoom ID"`, `"NOD format"`, `"AI journals"`).

### 💬 B. Right Column: Collapsible Accordion Feed
- **Header Section**: Displays the active category name, description, and an "Expand All / Collapse All" toggle switch.
- **FAQ Cards (Collapsible Accordions)**:
  - **Closed State**: Clean white cards with `16px` border-radius (`rounded-xl`), ambient drop shadow (`box-shadow: shadow-ambient`), showing the question title, category badge, and upvote counts.
  - **Open State**: Cards lift up slightly with hover transitions. The question text changes color to Coral (`#ff5c35`). The answer block slides open downward using smooth height animations.
  - **Markdown Rendering**: Fully supports bold lists, hyperlinked resources, and styled blocks.
  - **Vote & Share Utility Panel**: An inline footer in each card displaying upvote/downvote scores and a "Copy shareable anchor link" button that copies `#q-id` to the clipboard.

---

## 📢 3. Contextual Alert Banners & Interactive Helpers

To help candidates follow strict guidelines mentioned in the `FAQ.txt`, the FAQ cards render inline warning alerts:

### ⚠️ A. The Attention-to-Detail Check Alert (Offer Letter Section)
- For questions regarding offer letter acceptance, render a highlighted warning panel:
  > **⚠️ CRITICAL RULES NOTICE:**
  > Accepts must use the exact printed format. Paraphrases, missing dates, or missing clauses will result in **immediate and final withdrawal** of the offer.
- **Interactive Checkbox Tool**: A simple text testing helper where a user can paste their acceptance statement to verify if it contains the exact required phrases before sending it.

### 🚫 B. Rosetta AI Detection Warning (Rosetta Section)
- For Rosetta Journal FAQs, displays a styled dark callout box:
  > **🚫 JOURNAL RULE NO. 1:**
  > Write what is true in your own voice. Any entry detected as generated by ChatGPT or LLMs will invalidate your journal completion.

### 📋 C. NOC Verification Timer Alert (NOC Section)
- Displays a visual roadmap showing the validation timeline (1 hour to 1 working day) and status states to prevent candidates from raising unnecessary support tickets.

---

## ⚡ 4. Micro-interactions & Frontend Motion System

- **Accordion Toggle**: Use Framer Motion to animate `height` and `opacity` transition with parameters `type: "spring", stiffness: 300, damping: 30` to avoid layout jumps.
- **Search Text Highlighting**: Wrap matching query strings in `<mark class="bg-primary-fixed text-primary px-0.5 rounded font-semibold">` inside titles and answers.
- **Category Transitions**: When a category filter is clicked, stagger the entry of newly filtered cards (`delayChildren: 0.08s`).