/** Tiny ID generator — no external dependency needed */
export function nanoid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
