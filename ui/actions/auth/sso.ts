"use server";

import crypto from "crypto";

import { signIn } from "@/auth.config";
import { apiBaseUrl } from "@/lib";

// Single sign-on bridge. The HorizonVigil shell (test.horizonvigil.com) authenticates with
// Supabase; this app lives at /security on the same origin. The client reads the shell's
// Supabase access token and calls ssoLogin with it: we verify it at Supabase, then log the
// user in to the Cloud Security API (provisioning their account on first visit) and open a
// NextAuth session via the social-oauth provider. No second login.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const BRIDGE_SECRET = process.env.SSO_BRIDGE_SECRET;

const JSONAPI = {
  "Content-Type": "application/vnd.api+json",
  Accept: "application/vnd.api+json",
};

// Deterministic, non-guessable password the user never sees. Gated by the server-side
// BRIDGE_SECRET and a verified Supabase session; satisfies the API's 12-char complexity rule.
function derivePassword(email: string): string {
  const mac = crypto
    .createHmac("sha256", BRIDGE_SECRET as string)
    .update(email.trim().toLowerCase())
    .digest("base64url");
  return `Hv!${mac.slice(0, 40)}9`;
}

async function cloudSecurityToken(email: string, password: string) {
  const r = await fetch(`${apiBaseUrl}/tokens`, {
    method: "POST",
    headers: JSONAPI,
    body: JSON.stringify({ data: { type: "tokens", attributes: { email, password } } }),
  });
  if (!r.ok) return null;
  const j = await r.json();
  const access = j?.data?.attributes?.access;
  const refresh = j?.data?.attributes?.refresh;
  return access ? { accessToken: access as string, refreshToken: refresh as string } : null;
}

export async function ssoLogin(
  supabaseToken: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !BRIDGE_SECRET) {
    return { ok: false, reason: "not_configured" };
  }
  if (!supabaseToken) return { ok: false, reason: "no_platform_session" };

  // Verify the shell session server-side (signature + expiry checked at Supabase).
  const verify = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${supabaseToken}` },
  });
  if (!verify.ok) return { ok: false, reason: "invalid_session" };
  const user = await verify.json();
  const email: unknown = user?.email;
  if (typeof email !== "string" || !email) return { ok: false, reason: "no_email" };

  const password = derivePassword(email);

  // Log in, or provision the account on first visit then log in.
  let tokens = await cloudSecurityToken(email, password);
  if (!tokens) {
    const name =
      user?.user_metadata?.full_name || user?.user_metadata?.name || email.split("@")[0];
    await fetch(`${apiBaseUrl}/users`, {
      method: "POST",
      headers: JSONAPI,
      body: JSON.stringify({
        data: {
          type: "users",
          attributes: { name, email, password, company_name: "HorizonVigil" },
        },
      }),
    }).catch(() => undefined);
    tokens = await cloudSecurityToken(email, password);
  }
  if (!tokens) return { ok: false, reason: "provisioning_failed" };

  await signIn("social-oauth", {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    redirect: false,
  });
  return { ok: true };
}
