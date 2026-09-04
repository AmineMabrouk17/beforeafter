// preview-link.mjs — mint a one-click magic login link for a preview deployment.
// Usage:
//   SUPABASE_URL=... SERVICE_ROLE=... DEMO_EMAIL=... node preview-link.mjs <PREVIEW_URL>
// Prints an action_link. Open it in your browser → logged in on that preview host.
// SECURITY: SERVICE_ROLE never leaves this machine. Never paste links into public PRs
// (they are bearer credentials, single-use, short expiry). Demo account must hold
// demo-only data with normal RLS applied.
//
// Works with the standard PKCE callback: GET /auth/callback?code=...&next=/dashboard
// that calls supabase.auth.exchangeCodeForSession(code).

const preview = process.argv[2];
if (!preview || !/^https:\/\//.test(preview)) {
  console.error("Usage: node preview-link.mjs <PREVIEW_URL>");
  process.exit(1);
}
const { SUPABASE_URL, SERVICE_ROLE, DEMO_EMAIL } = process.env;
if (!SUPABASE_URL || !SERVICE_ROLE || !DEMO_EMAIL) {
  console.error("Missing env: SUPABASE_URL, SERVICE_ROLE, DEMO_EMAIL");
  process.exit(1);
}

const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
  method: "POST",
  headers: {
    apikey: SERVICE_ROLE,
    Authorization: `Bearer ${SERVICE_ROLE}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    type: "magiclink",
    email: DEMO_EMAIL,
    options: { redirectTo: `${preview.replace(/\/$/, "")}/auth/callback?next=/dashboard` },
  }),
});
const data = await res.json();
if (!res.ok) {
  console.error("generate_link failed:", JSON.stringify(data));
  process.exit(1);
}
console.log(data.action_link);
