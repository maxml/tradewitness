import { z } from "zod";

/**
 * Canonical API contract shared across:
 *   - Desktop collector (TradeWitness overlay) — POSTs TradeInput to backend
 *   - Web app backend (Bilovodskyi-based) — validates, persists via Drizzle
 *   - Web app frontend — form types, list views, public profile
 *
 * This file is the source of truth for the wire format.
 * The database shape lives in apps/app/src/drizzle/schema.ts and should be
 * kept aligned with these types.
 */

export const PositionTypeSchema = z.enum(["long", "short"]);
export type PositionType = z.infer<typeof PositionTypeSchema>;

export const TradeRuleSchema = z.object({
    id: z.string(),
    rule: z.string(),
    satisfied: z.boolean(),
    priority: z.enum(["low", "medium", "high"]),
});
export type TradeRule = z.infer<typeof TradeRuleSchema>;

export const CloseEventSchema = z.object({
    id: z.string(),
    date: z.string(),
    time: z.string(),
    quantitySold: z.number().nonnegative(),
    sellPrice: z.number().positive(),
    result: z.number(),
});
export type CloseEvent = z.infer<typeof CloseEventSchema>;

/**
 * TradeInput — minimal payload the desktop collector sends.
 * OCR fills what it can; rest is added via web UI.
 */
export const TradeInputSchema = z.object({
    userId: z.string(),
    symbolName: z.string().min(1),
    positionType: PositionTypeSchema,
    openDate: z.string(),
    openTime: z.string(),
    entryPrice: z.number().positive(),
    quantity: z.number().positive(),
    deposit: z.number().nonnegative().optional(),
    instrumentName: z.string().optional(),
    screenshotUrl: z.string().url().optional(),
    capturedAt: z.string().datetime(),
    notes: z.string().max(4000).optional(),
});
export type TradeInput = z.infer<typeof TradeInputSchema>;

/**
 * Trade — full record as stored and returned by the API.
 */
export const TradeSchema = TradeInputSchema.extend({
    id: z.string().uuid(),
    isActiveTrade: z.boolean(),
    closeDate: z.string().optional(),
    closeTime: z.string().optional(),
    result: z.number().optional(),
    rules: z.array(TradeRuleSchema).default([]),
    closeEvents: z.array(CloseEventSchema).default([]),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
export type Trade = z.infer<typeof TradeSchema>;

/**
 * TradeUpdate — patch shape, used when closing a position or editing metadata.
 */
export const TradeUpdateSchema = TradeSchema.partial().pick({
    closeDate: true,
    closeTime: true,
    result: true,
    isActiveTrade: true,
    rules: true,
    closeEvents: true,
    notes: true,
});
export type TradeUpdate = z.infer<typeof TradeUpdateSchema>;
