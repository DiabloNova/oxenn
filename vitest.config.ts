import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
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
          passWithNoTests: false,
        },
      },
      {
        extends: true,
        test: {
          name: "db",
          environment: "node",
          include: ["tests/db/**/*.test.ts"],
          passWithNoTests: true, // TEMP: flipped to false by OX-104 when tests/db is seeded
        },
      },
      {
        extends: true,
        test: {
          name: "ui",
          environment: "jsdom",
          setupFiles: ["tests/setup/ui-setup.ts"],
          include: ["tests/ui/**/*.test.tsx", "tests/ui/**/*.test.ts"],
          passWithNoTests: false,
        },
      },
    ],
  },
});
