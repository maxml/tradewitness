# Technical Plan: Task 5 - Integrating Trading Math

## Background & Motivation
The current SaaS template provides basic CRUD functionality for trades, but lacks the professional, mathematical depth required for a serious Trading Journal. The `journedge` donor repository contains excellent business logic for calculating advanced trading metrics like Maximum Adverse Excursion (MAE), Maximum Favorable Excursion (MFE), Expectancy, Profit Factor, and plotting an Equity Curve.

This task focuses on porting that logic into our Drizzle schemas and integrating it into our dashboard UI.

## Scope & Impact
- Update the `TradeTable` schema in `apps/app/src/drizzle/schema.ts` to include columns for MAE, MFE, Risk/Reward Ratio (RRR), and Fees.
- Update the shared Zod schemas in `packages/api-types` to reflect these new fields.
- Port the calculation utility functions from the `journedge` donor into `apps/app/src/features/statistics/`.
- Update the UI components (`StatsGridPageOne`, `StatsGridPageTwo`) to display these new metrics.
- Implement an Equity Curve chart using `@mui/x-charts` or `recharts`.

## Implementation Steps
1. **Schema Update:** Add `mae`, `mfe`, `fees`, and `netProfit` columns to `TradeTable` (using `numeric` or `real` types).
2. **Migration:** Run `pnpm --filter @tradewitness/app db:generate` followed by `db:migrate` to apply the changes to Supabase.
3. **Math Utilities:** Create `src/lib/trading-math.ts`. Port pure functions for calculating:
   - `calculateWinRate(trades)`
   - `calculateProfitFactor(trades)`
   - `calculateExpectancy(trades)`
   - `generateEquityCurve(trades, initialCapital)`
4. **UI Integration:** In the statistics pages, use these utilities to compute the metrics on the fly from the fetched `trades` array and feed the result into the Recharts/MUI charts.

## Verification
- The database successfully stores MAE and MFE values.
- The dashboard displays accurate Win Rate, Profit Factor, and Expectancy based on the user's trade history.
- The Equity Curve chart accurately reflects the cumulative net profit over time.