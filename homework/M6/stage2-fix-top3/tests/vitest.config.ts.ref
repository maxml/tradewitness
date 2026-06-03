import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Vitest config for TradeWitness app (M6 Stage 2 characterization tests).
// tsconfigPaths resolves the `@/*` -> ./src/* alias used by server actions.
export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        environment: "node",
        globals: true,
        include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    },
});
