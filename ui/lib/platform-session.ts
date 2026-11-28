/** Connected cloud accounts per provider, as the platform counts them. */
export interface CloudCounts {
  aws: number;
  azure: number;
  gcp: number;
}

/**
 * The HorizonVigil shell and this workspace are served from one origin, so the
 * shell's stored session is readable here. Used to speak to the platform as
 * the signed-in person rather than with a service credential.
 */
export function readPlatformToken(): string | null {
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        const parsed = JSON.parse(localStorage.getItem(key) || "null");
        const token = parsed?.access_token ?? parsed?.currentSession?.access_token;
        if (typeof token === "string" && token) return token;
      }
    }
  } catch {
    // storage blocked or not JSON: treat as no platform session
  }
  return null;
}
