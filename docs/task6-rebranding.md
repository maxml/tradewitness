# Technical Plan: Task 6 - Deep Content Rebranding

## Background & Motivation
The `apps/landing` application is based on a personal portfolio template (`pranata-dev`). Currently, it features routes like `/experience`, `/projects`, and `/skills`, which do not align with a SaaS Trading Journal. We need to completely rebrand this application to reflect the "TradeWitness" identity, creating marketing pages, pricing plans, and a unified blog structure.

## Scope & Impact
- Remove portfolio-specific routes (`/experience`, `/projects`, `/skills`).
- Restructure the homepage (`app/page.tsx`) to highlight the features of TradeWitness (OCR Desktop Collector, AI Prompts, Advanced Math, Mentor CRM).
- Update the `i18n` internationalization dictionaries (`src/lib/i18n/en.ts`) with new copy.
- Implement a `/pricing` page (using dummy data, as Stripe is currently disabled via feature flag).
- Ensure the overall styling (Tailwind v4) reflects a modern financial/SaaS aesthetic.

## Implementation Steps
1. **Route Deletion:** Delete the folders `app/experience`, `app/projects`, and `app/skills` in `apps/landing/src/`.
2. **Homepage Overhaul:** Rewrite `Hero.tsx` and `HomePage.tsx` to describe TradeWitness. Replace personal headshots with product mockups or placeholder images.
3. **Pricing Page:** Create a new route `app/pricing/page.tsx`. Build a responsive pricing grid showing "Free" vs "Pro" features.
4. **Copywriting:** Go through `src/lib/i18n/` and replace all strings with TradeWitness branding. 
5. **SEO & Meta:** Ensure all `layout.tsx` files have the correct OpenGraph images, titles, and descriptions.

## Verification
- Navigating to `/experience` returns a 404.
- The homepage clearly explains TradeWitness.
- The landing page compiles without any type errors or missing imports from the deleted routes.