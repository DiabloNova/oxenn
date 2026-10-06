import { PostgresClient, DatabaseUnavailableError } from "@/features/admin/infrastructure/persistence/postgres/index";
import { execSync } from "child_process";

async function runTests() {
  console.log("=========================================================================");
  console.log("STAGE 6 — FAIL-CLOSED TESTS");
  console.log("=========================================================================\n");

  let passed = 0;
  let total = 0;

  function pass(msg: string) {
    console.log(`✅ PASS: ${msg}`);
    passed++;
    total++;
  }

  function fail(msg: string) {
    console.error(`❌ FAIL: ${msg}`);
    total++;
  }

  // Save the original DATABASE_URL
  const originalDbUrl = process.env.DATABASE_URL;

  try {
    // Test A: Missing DATABASE_URL throws in constructor/connect
    console.log("--- Test A: Missing DATABASE_URL ---");
    delete process.env.DATABASE_URL;
    try {
      // Create a fresh instance (but since it's a singleton, we need to bypass static getter or test connection directly)
      // Actually we can just test if new instantiation throws, but we'll try to reset the singleton if possible.
      // TypeScript private constructor bypass:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new (PostgresClient as any)();
      fail("Constructor should have thrown an error about missing DATABASE_URL");
    } catch (err) {
      if (err instanceof Error && err.message === "DATABASE_URL is required") {
        pass("Missing DATABASE_URL throws Error('DATABASE_URL is required')");
      } else {
        fail(`Unexpected error: ${err}`);
      }
    }

    // Test B: Connect to closed port throws DatabaseUnavailableError
    console.log("\n--- Test B: Connect to closed port ---");
    process.env.DATABASE_URL = "postgres://x:y@localhost:1/x";
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pgClient = new (PostgresClient as any)();
      await pgClient.connectClient();
      fail("connectClient should have thrown DatabaseUnavailableError");
    } catch (err) {
      if (err instanceof DatabaseUnavailableError) {
        pass("Connecting to a closed port rejects with DatabaseUnavailableError");
      } else {
        fail(`Unexpected error: ${err}`);
      }
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pgClient = new (PostgresClient as any)();
      await pgClient.query("SELECT 1");
      fail("query should have thrown DatabaseUnavailableError");
    } catch (err) {
      if (err instanceof DatabaseUnavailableError) {
        pass("Querying with closed port rejects with DatabaseUnavailableError");
      } else {
        fail(`Unexpected error: ${err}`);
      }
    }

    // Test C: MockPoolClient absent from src
    console.log("\n--- Test C: Grep assertion for MockPoolClient ---");
    try {
      execSync('grep -rn "class MockPoolClient" src/');
      fail("Found MockPoolClient in src/");
    } catch (err) {
      // grep exits with 1 when no lines are selected, which is what we want
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((err as any).status === 1) {
        pass("No MockPoolClient found in src/ (grep returned exit code 1)");
      } else {
        fail(`Unexpected error running grep: ${err}`);
      }
    }

  } finally {
    // Restore the original DATABASE_URL
    if (originalDbUrl !== undefined) {
      process.env.DATABASE_URL = originalDbUrl;
    } else {
      delete process.env.DATABASE_URL;
    }
  }

  console.log(`\n=========================================================================`);
  console.log(`RESULTS: ${passed} / ${total} tests passed.`);
  console.log(`=========================================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
