import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { freeAuditRateLimitCleanup, helloWorld, scheduledMonitoring, processEmailOutbox, recoverEmailOutbox } from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    helloWorld,
    scheduledMonitoring,
    freeAuditRateLimitCleanup,
    processEmailOutbox,
    recoverEmailOutbox,
  ],
});
