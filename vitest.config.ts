import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    passWithNoTests: true,
    coverage: {
      provider: "v8",
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          // @ts-expect-error Vitest ProjectConfig omits passWithNoTests in TypeScript types
          passWithNoTests: false,
          include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
        },
      },
      {
        extends: true,
        test: {
          name: "db",
          environment: "node",
          // @ts-expect-error Vitest ProjectConfig omits passWithNoTests in TypeScript types
          passWithNoTests: false, // Flipped to false by OX-104 as tests/db is now seeded
          include: ["tests/db/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "ui",
          environment: "jsdom",
          setupFiles: ["tests/setup/ui-setup.ts"],
          // @ts-expect-error Vitest ProjectConfig omits passWithNoTests in TypeScript types
          passWithNoTests: false,
          include: ["tests/ui/**/*.test.tsx", "tests/ui/**/*.test.ts"],
        },
      },
    ],
  },
});
