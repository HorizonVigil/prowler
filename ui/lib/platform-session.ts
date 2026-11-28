/** Connected cloud accounts per provider, as the platform counts them. */
export interface CloudCounts {
  aws: number;
  azure: number;
  gcp: number;
}

// The platform session token is read via readPlatformToken in
// lib/platform-storage.ts (it matches the shell's custom storageKey). The
// earlier sb-*-auth-token-only reader lived here and never matched.
