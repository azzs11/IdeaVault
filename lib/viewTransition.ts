/**
 * Run a state update inside a View Transition when the browser supports it
 * and the user hasn't asked for reduced motion. Falls back to a plain update
 * everywhere else, so callers never need to branch.
 */
export function withViewTransition(update: () => void) {
  if (typeof document === "undefined") { update(); return; }
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  const reduce = typeof window !== "undefined"
    && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduce || typeof doc.startViewTransition !== "function") { update(); return; }
  doc.startViewTransition(update);
}
