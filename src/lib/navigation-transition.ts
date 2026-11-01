/**
 * Shared event contract for client-side route transitions initiated by navigation controls.
 * The floating workspace dock listens for this event to hide before the destination route
 * commits, preventing clicks against the transition screen.
 */
export const NAVIGATION_START_EVENT = "oxenn:navigation-start";

/**
 * Notify navigation-aware UI that an internal pathname change is about to start.
 * Query-only and hash-only updates do not hide route-level navigation.
 */
export function notifyNavigationStart(destination?: string): void {
  if (typeof window === "undefined") return;

  if (destination) {
    try {
      const target = new URL(destination, window.location.href);
      if (target.origin !== window.location.origin || target.pathname === window.location.pathname) {
        return;
      }
    } catch {
      return;
    }
  }

  window.dispatchEvent(new Event(NAVIGATION_START_EVENT));
}
