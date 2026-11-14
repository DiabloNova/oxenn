import { after } from "next/server";
import { inngest } from "@/lib/inngest/client";

/**
 * The committed database row is durable; this event is only a low-latency wake-up.
 * A scheduled Inngest sweep recovers rows if this after-response dispatch is lost.
 */
export function dispatchEmailOutboxAfterResponse(outboxId: string): void {
  try {
    after(async () => {
      try {
        await inngest.send({ name: "email/outbox.dispatch", data: { outboxId } });
      } catch {
        console.error("Email outbox event dispatch failed", { outboxId });
      }
    });
  } catch {
    // The periodic recovery sweep remains authoritative if after() is unavailable.
    console.error("Email outbox response hook could not be registered", { outboxId });
  }
}
