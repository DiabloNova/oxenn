import { ObservabilityContext } from "./types";

/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- AsyncLocalStorage class constructor dynamic reference */
let AsyncLocalStorageClass: any = null;

// Dynamically check if we are in a Node.js environment where AsyncLocalStorage is available
if (typeof window === "undefined" && typeof process !== "undefined" && process.versions && process.versions.node) {
  try {
    // Conditional require to prevent compiler/bundler from leaking Node-only APIs into Edge/Serverless modules
    /* eslint-disable-next-line @typescript-eslint/no-require-imports -- Conditional dynamic require for Node.js async_hooks in Edge-safe fallback */
    AsyncLocalStorageClass = require("node:async_hooks").AsyncLocalStorage;
  } catch {
    // Fallback if async_hooks is not available
  }
}

export class ObservabilityContextManager {
  private static storage = AsyncLocalStorageClass ? new AsyncLocalStorageClass() : null;
  private static fallbackStore = new Map<string, ObservabilityContext>(); // Safe in-memory map fallback for Edge/Browser

  public static runWithContext<T>(context: ObservabilityContext, work: () => T): T {
    if (this.storage) {
      return this.storage.run(context, work);
    } else {
      // Edge / browser safe isolation fallback (scoped execution via manual track or temporary ID mapping)
      const executionId = context.requestId || "edge-execution";
      this.fallbackStore.set(executionId, context);
      try {
        return work();
      } finally {
        this.fallbackStore.delete(executionId);
      }
    }
  }

  public static get(): ObservabilityContext | null {
    if (this.storage) {
      return this.storage.getStore() || null;
    }
    // Return null or most recent on Edge, preventing Node-only crashes
    return null;
  }
}
