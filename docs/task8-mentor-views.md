# Technical Plan: Task 8 - Public Profile & Mentor Views

## Background & Motivation
TradeWitness is designed not just as a personal journal, but as a mentorship CRM. Traders need to be able to share their performance with mentors without giving them access to their login credentials. We need to create read-only "Public Portfolios" that aggregate a user's stats, win rate, and Discipline Score.

## Scope & Impact
- Add a boolean flag `isPublic` and a `username` alias to the `users` table or profile schema in Supabase.
- Create a new public route in the Landing Page or the Web App: `/u/[username]`.
- Fetch and display the trader's statistics and anonymized trade history (e.g., hiding exact dollar amounts if configured, showing only percentages/R-multiples).
- Implement the logic for the "Discipline Score" (a proprietary metric based on adherence to strategy rules).

## Implementation Steps
1. **Schema Update:** Update Drizzle schema to include `ProfileTable` with `username` (unique), `isPublic` (boolean), and `hideDollarAmounts` (boolean). Run migrations.
2. **Public Route:** Create `apps/landing/src/app/u/[username]/page.tsx` (using Supabase Client) OR `apps/app/src/app/u/[username]/page.tsx` (using Drizzle).
3. **Data Fetching:** The route should query the database for trades `where(eq(TradeTable.userId, targetUserId))`. Since we disabled RLS for Clerk, this server-side query is safe, provided we ensure the `isPublic` flag is true before rendering.
4. **Discipline Score:** Implement a server-side algorithm `calculateDisciplineScore(trades)` that grades the trader based on fields like `appliedCloseRules` and `MAE`.

## Verification
- Navigating to `/u/target-username` displays a beautiful, read-only dashboard.
- If `isPublic` is false, the route returns a 404 or "Private Profile" message.
- Mentors can view the Equity Curve and Discipline Score without logging in.