/**
 * Reads the HorizonVigil shell's Supabase session from shared same-origin
 * storage, so the Cloud Security app can bridge an existing platform session
 * instead of asking for credentials again.
 *
 * The shell sets its own Supabase storageKey (its src/lib/supabase.ts), so the
 * default sb-<ref>-auth-token key never exists on this origin. Matching only
 * that pattern stranded users whose Security tokens had expired on the sign-in
 * form, unable to get back in while holding a valid platform session.
 */
const PLATFORM_STORAGE_KEY = "horizonvigil-auth";

function tokenFrom(key: string): string | null {
  const parsed = JSON.parse(localStorage.getItem(key) || "null");
  const token = parsed?.access_token ?? parsed?.currentSession?.access_token;
  return typeof token === "string" && token ? token : null;
}

export function readPlatformToken(): string | null {
  try {
    const configured = tokenFrom(PLATFORM_STORAGE_KEY);
    if (configured) return configured;

    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        const token = tokenFrom(key);
        if (token) return token;
      }
    }
  } catch {
    // storage blocked / not JSON — fall through to the normal sign-in form
  }
  return null;
}
