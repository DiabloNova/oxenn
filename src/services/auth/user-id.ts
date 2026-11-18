import { randomUUID } from "node:crypto";

/** Generates the opaque, globally unique ID used by newly registered users. */
export function generateUserId(): string {
  return "usr-" + randomUUID();
}
