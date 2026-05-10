import { z } from 'zod';

export const FeatureFlagStateSchema = z.enum(['Disabled', 'Testing', 'Enabled']);
export type FeatureFlagState = z.infer<typeof FeatureFlagStateSchema>;

export const FeatureFlagSchema = z.object({
  name: z.string(),
  status: FeatureFlagStateSchema,
  traffic_percentage: z.number().int().min(0).max(100),
  depends_on: z.array(z.string()),
  last_modified: z.string()
});
export type FeatureFlag = z.infer<typeof FeatureFlagSchema>;

export class DependencyGraph {
  private flagsMap: Map<string, FeatureFlag>;

  constructor(flags: FeatureFlag[]) {
    this.flagsMap = new Map(flags.map(f => [f.name, f]));
  }

  public getFlag(name: string): FeatureFlag | undefined {
    return this.flagsMap.get(name);
  }

  public validateStateChange(flagName: string, newState: FeatureFlagState): { allowed: true } | { allowed: false; reason: string } {
    const flag = this.getFlag(flagName);
    if (!flag) return { allowed: false, reason: `Flag ${flagName} not found` };

    if (newState === 'Enabled' || newState === 'Testing') {
      for (const depName of flag.depends_on) {
        const dep = this.getFlag(depName);
        if (!dep) {
          return { allowed: false, reason: `Dependency ${depName} not found` };
        }
        if (dep.status === 'Disabled') {
          return { allowed: false, reason: `Cannot set ${flagName} to ${newState} because dependency ${depName} is Disabled.` };
        }
      }
    }

    if (newState === 'Disabled') {
      for (const [childName, child] of Array.from(this.flagsMap.entries())) {
        if (child.depends_on.includes(flagName) && child.status !== 'Disabled') {
          return { allowed: false, reason: `Cannot disable ${flagName} because child ${childName} is currently ${child.status}.` };
        }
      }
    }

    return { allowed: true };
  }

  public validateTrafficChange(flagName: string, traffic: number): { allowed: true } | { allowed: false; reason: string } {
    const flag = this.getFlag(flagName);
    if (!flag) return { allowed: false, reason: `Flag ${flagName} not found` };

    if (flag.status === 'Disabled' && traffic > 0) {
      return { allowed: false, reason: `Cannot set traffic to ${traffic} because ${flagName} is Disabled.` };
    }

    return { allowed: true };
  }
}
