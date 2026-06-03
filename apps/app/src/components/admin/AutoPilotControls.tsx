"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FeatureFlag } from "@tradewitness/feature-flags-core";
import { AutoPilotAction, callAutoPilot } from "@/app/private/admin/features/auto-pilot";

interface Props {
  feature: FeatureFlag;
  onUpdate: (next: FeatureFlag) => void;
}

const ACTION_LABELS: Record<AutoPilotAction, { idle: string; busy: string }> = {
  check: { idle: "Запустити перевірку", busy: "Перевіряємо…" },
  test: { idle: "Тестовий режим", busy: "Включаємо…" },
  rollback: { idle: "Відкатити", busy: "Відкатуємо…" },
};

export default function AutoPilotControls({ feature, onUpdate }: Props) {
  const [loading, setLoading] = useState<AutoPilotAction | null>(null);

  async function dispatch(action: AutoPilotAction) {
    setLoading(action);
    const result = await callAutoPilot(feature.name, action);
    setLoading(null);

    if (!result.success) {
      const tag = result.rejected_at ? ` [${result.rejected_at}]` : "";
      toast.error(`${feature.name}: ${result.message}${tag}`);
      return;
    }

    if (result.current_state) {
      onUpdate(result.current_state);
    }
    toast.success(`${feature.name}: ${result.message}`);
  }

  const anyLoading = loading !== null;

  return (
    <div
      className="mt-3 pt-3 border-t border-border/50 space-y-2"
      aria-label={`Auto-Pilot controls for ${feature.name}`}
    >
      <div className="text-xs text-muted">Auto-Pilot (через n8n)</div>
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(ACTION_LABELS) as AutoPilotAction[]).map((action) => {
          const isBusy = loading === action;
          const labels = ACTION_LABELS[action];
          const tone =
            action === "rollback"
              ? "border-destructive/40 text-destructive hover:bg-destructive/10"
              : "border-border text-foreground hover:bg-card-hover";
          return (
            <button
              key={action}
              type="button"
              onClick={() => dispatch(action)}
              disabled={anyLoading}
              className={`px-2 py-1.5 text-xs rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${tone}`}
            >
              {isBusy ? labels.busy : labels.idle}
            </button>
          );
        })}
      </div>
    </div>
  );
}
