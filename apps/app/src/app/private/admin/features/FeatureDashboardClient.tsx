"use client";

import { useState } from "react";
import { FeatureFlag, FeatureFlagState } from "@tradewitness/feature-flags-core";
import { updateFeatureFlag } from "./actions";
import { toast } from "sonner";
import * as Switch from "@radix-ui/react-switch";
import * as Slider from "@radix-ui/react-slider";

interface Props {
  initialFlags: FeatureFlag[];
}

export default function FeatureDashboardClient({ initialFlags }: Props) {
  const [flags, setFlags] = useState<FeatureFlag[]>(initialFlags);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | FeatureFlagState>("All");
  const [loadingFlag, setLoadingFlag] = useState<string | null>(null);

  const filteredFlags = flags.filter(flag => {
    if (statusFilter !== "All" && flag.status !== statusFilter) return false;
    if (search && !flag.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleStatusChange = async (name: string, checked: boolean) => {
    const flag = flags.find(f => f.name === name);
    if (!flag) return;

    // Disabled -> Testing, Testing/Enabled -> Disabled
    const nextStatus: FeatureFlagState = checked ? "Testing" : "Disabled";
    
    // Optimistic UI update
    const previousFlags = [...flags];
    setFlags(flags.map(f => f.name === name ? { ...f, status: nextStatus, traffic_percentage: nextStatus === "Disabled" ? 0 : f.traffic_percentage } : f));
    setLoadingFlag(name);

    const res = await updateFeatureFlag(name, { status: nextStatus });
    setLoadingFlag(null);

    if (!res.success) {
      toast.error(res.error || "Failed to update status.");
      setFlags(previousFlags); // Rollback
    } else {
      toast.success(`${name} status updated to ${nextStatus}.`);
      setFlags(flags.map(f => f.name === name ? res.data : f));
    }
  };

  const handleTrafficChange = async (name: string, val: number[]) => {
    const value = val[0];
    const previousFlags = [...flags];
    setFlags(flags.map(f => f.name === name ? { ...f, traffic_percentage: value } : f));
    setLoadingFlag(name);

    const res = await updateFeatureFlag(name, { traffic_percentage: value });
    setLoadingFlag(null);

    if (!res.success) {
      toast.error(res.error || "Failed to update traffic.");
      setFlags(previousFlags); // Rollback
    } else {
      toast.success(`${name} traffic updated to ${value}%.`);
      setFlags(flags.map(f => f.name === name ? res.data : f));
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feature Flags</h1>
          <p className="text-muted mt-1">Manage global feature rollouts and kill switches.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search flags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
            aria-label="Search feature flags"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
            aria-label="Filter flags by status"
          >
            <option value="All">All Statuses</option>
            <option value="Enabled">Enabled</option>
            <option value="Testing">Testing</option>
            <option value="Disabled">Disabled</option>
          </select>
        </div>
      </div>

      {filteredFlags.length === 0 ? (
        <div className="p-12 text-center bg-card border border-border rounded-lg">
          <h3 className="text-lg font-medium text-foreground">No feature flags found</h3>
          <p className="text-muted mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredFlags.map((flag) => {
            const isLoading = loadingFlag === flag.name;
            const isDisabled = flag.status === "Disabled";
            const isChecked = flag.status === "Enabled" || flag.status === "Testing";

            return (
              <div 
                key={flag.name} 
                className={`flex flex-col p-5 bg-card border border-border rounded-lg transition-colors hover:border-ring/50 ${isLoading ? 'opacity-70' : ''}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 pr-4">
                    <h3 className="font-semibold text-foreground truncate" title={flag.name}>
                      {flag.name}
                    </h3>
                    <div className="mt-2 flex gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        flag.status === 'Enabled' ? 'bg-success/15 text-success border-success/30' :
                        flag.status === 'Testing' ? 'bg-accent/15 text-accent border-accent/30' :
                        'bg-muted/15 text-muted border-muted/30'
                      }`}>
                        {flag.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Switch.Root
                      checked={isChecked}
                      onCheckedChange={(checked) => handleStatusChange(flag.name, checked)}
                      disabled={isLoading}
                      className={`w-[42px] h-[24px] rounded-full relative outline-none cursor-pointer border border-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors ${isChecked ? 'bg-primary' : 'bg-zinc-700'}`}
                      aria-label={`Toggle feature ${flag.name}`}
                    >
                      <Switch.Thumb className={`block w-[18px] h-[18px] bg-white rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform ${isChecked ? 'translate-x-[20px]' : ''}`} />
                    </Switch.Root>
                  </div>
                </div>

                <div className="mt-auto space-y-4 pt-4 border-t border-border/50">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">Traffic Rollout</span>
                      <span className="font-medium font-mono">{flag.traffic_percentage}%</span>
                    </div>
                    <Slider.Root
                      className="relative flex items-center select-none touch-none w-full h-5"
                      value={[flag.traffic_percentage]}
                      onValueCommit={(val) => handleTrafficChange(flag.name, val)}
                      max={100}
                      step={5}
                      disabled={isDisabled || isLoading}
                      aria-label={`Traffic percentage for ${flag.name}`}
                    >
                      <Slider.Track className={`bg-zinc-800 relative grow rounded-full h-1.5 ${isDisabled ? 'opacity-50' : ''}`}>
                        <Slider.Range className="absolute bg-primary rounded-full h-full" />
                      </Slider.Track>
                      <Slider.Thumb className={`block w-4 h-4 bg-white border border-border rounded-full hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-ring ${isDisabled ? 'hidden' : ''}`} />
                    </Slider.Root>
                  </div>

                  <div className="flex flex-col gap-1 text-xs text-muted">
                    <div className="flex gap-2">
                      <span className="w-16 shrink-0">Depends:</span>
                      <span className="truncate" title={flag.depends_on.join(', ') || 'None'}>
                        {flag.depends_on.join(', ') || 'None'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-16 shrink-0">Updated:</span>
                      <span>{new Date(flag.last_modified).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
