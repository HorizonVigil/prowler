"use server";

/**
 * Connected cloud accounts per provider, read from the platform rather than
 * from this workspace's own providers: clouds are onboarded once in
 * HorizonVigil, and a count taken from here would report only what has been
 * synced, which reads as data loss rather than as a pending sync.
 *
 * Queried with the caller's own platform token so row-level security decides
 * what they may see; no service credential is involved.
 */
import type { CloudCounts } from "@/lib/platform-session";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

export async function platformCloudCounts(
  platformToken: string,
): Promise<CloudCounts | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !platformToken) return null;

  const url = `${SUPABASE_URL}/rest/v1/cloud_connections?select=provider&status=eq.connected`;
  const response = await fetch(url, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${platformToken}` },
    cache: "no-store",
  }).catch(() => null);
  if (!response || !response.ok) return null;

  const rows = await response.json().catch(() => null);
  if (!Array.isArray(rows)) return null;

  const counts: CloudCounts = { aws: 0, azure: 0, gcp: 0 };
  for (const row of rows) {
    // unknown, not any: the comparisons below are what narrow this to a key of
    // CloudCounts, and `any` would skip that narrowing.
    const provider: unknown = row?.provider;
    if (provider === "aws" || provider === "azure" || provider === "gcp") {
      counts[provider] += 1;
    }
  }
  return counts;
}
