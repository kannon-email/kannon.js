import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        "node_modules/",
        "lib/",
        "src/proto/",
        "**/*.d.ts",
        "vitest.config.ts",
      ],
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
    environment: "node",
    globals: true,
  },
});
