// Public API base URL for client-side fetches (subscribe, GoFundMe, etc.).
// Reads from a Vite-exposed env var so it ends up in the browser bundle, with
// a relative fallback for same-origin deployments.
export const PUBLIC_API_BASE_URL: string =
  (import.meta.env.VITE_PUBLIC_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
