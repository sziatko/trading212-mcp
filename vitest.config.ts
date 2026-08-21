import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./test/setup.ts"],
    coverage: {
      all: true,
      include: ["src/**/*.ts"],
      // api/types.ts is excluded because every consumer now imports it with
      // `import type`, which tsc erases entirely — the module is never
      // loaded at runtime (0 executable lines), not merely untested.
      exclude: ["src/**/*.test.ts", "src/index.ts", "src/api/types.ts"],
    },
  },
});
