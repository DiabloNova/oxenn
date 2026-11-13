import { inngest } from "./client";
import { cleanupExpiredFreeAuditRateLimits } from "@/services/audit/free-audit-rate-limit-cleanup";

export const helloWorld = inngest.createFunction(
  { id: "hello-world", triggers: [{ event: "test/hello.world" }] },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { event, body: "Hello, World!" };
  },
);

export const scheduledMonitoring = inngest.createFunction(
  { id: "scheduled-monitoring-placeholder", triggers: [{ cron: "0 * * * *" }] },
  async ({ step }) => {
    await step.run("execute-monitoring", async () => {
      // Placeholder for future Website Monitoring job implementation
      console.log("Running scheduled monitoring placeholder...");
      return { status: "success", timestamp: new Date().toISOString() };
    });
    return { message: "Scheduled monitoring completed" };
  },
);

export const freeAuditRateLimitCleanup = inngest.createFunction(
  { id: "free-audit-rate-limit-cleanup", triggers: [{ cron: "*/15 * * * *" }] },
  async ({ step }) => {
    const deletedRows = await step.run("delete-expired-free-audit-buckets", cleanupExpiredFreeAuditRateLimits);
    return { deletedRows };
  },
);
