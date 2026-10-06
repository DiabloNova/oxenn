import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    passWithNoTests: false,
    coverage: {
      provider: "v8",
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
        },
      },
      {
        extends: true,
        test: {
          name: "db",
          environment: "node",
          // TEMP: flipped to false by OX-104 when tests/db is seeded
          include: ["tests/db/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "ui",
          environment: "jsdom",
          setupFiles: ["tests/setup/ui-setup.ts"],
          include: ["tests/ui/**/*.test.tsx", "tests/ui/**/*.test.ts"],
        },
      },
    ],
  },
});
