// M7 — cost accounting for the cloud leg. Local leg is always $0.00. See §8.
import "server-only";

type Price = { inUsdPer1M: number; outUsdPer1M: number };

// Published provider pricing (USD per 1M tokens). Keyed by model id prefix.
const PRICING: Record<string, Price> = {
    // OpenRouter cloud leg (default).
    "openai/gpt-4o-mini": { inUsdPer1M: 0.15, outUsdPer1M: 0.6 },
    "openai/gpt-4o": { inUsdPer1M: 2.5, outUsdPer1M: 10 },
    "google/gemini-2.0-flash-001": { inUsdPer1M: 0.1, outUsdPer1M: 0.4 },
    // Anthropic (kept for reference / if CLOUD_MODEL is pointed back at Claude).
    "claude-sonnet-4-5": { inUsdPer1M: 3, outUsdPer1M: 15 },
    "claude-3-7-sonnet": { inUsdPer1M: 3, outUsdPer1M: 15 },
    "claude-opus-4": { inUsdPer1M: 15, outUsdPer1M: 75 },
    "claude-haiku-4": { inUsdPer1M: 1, outUsdPer1M: 5 },
};

function priceFor(model: string): Price | undefined {
    const key = Object.keys(PRICING).find((k) => model.startsWith(k));
    return key ? PRICING[key] : undefined;
}

export type CostResult = { costUsd: number | null; costReason: string | null };

export type Usage = { input_tokens?: number; output_tokens?: number } | null | undefined;

export function computeCloudCost(model: string, usage: Usage): CostResult {
    if (!usage || usage.input_tokens == null || usage.output_tokens == null) {
        return { costUsd: null, costReason: "usage_missing" };
    }
    const price = priceFor(model);
    if (!price) {
        return { costUsd: null, costReason: `no_pricing_for_model:${model}` };
    }
    const cost =
        (usage.input_tokens / 1_000_000) * price.inUsdPer1M +
        (usage.output_tokens / 1_000_000) * price.outUsdPer1M;
    return { costUsd: Number(cost.toFixed(6)), costReason: null };
}

/** The local (private) leg never costs money. */
export const LOCAL_COST: CostResult = { costUsd: 0, costReason: null };
