#!/usr/bin/env node
/**
 * Portal → website drift check.
 *
 * The website follows the portal's prices automatically (sync-pricing.mjs), but
 * STRUCTURAL changes do not: a NEW sellable service added in the portal stays
 * invisible until someone lists its code in a group in src/data/pricing.js.
 * Nothing used to warn about that — this script does.
 *
 * It compares the portal's live, sellable services against the codes the website
 * actually publishes, and reports:
 *   • services in the portal that the site is NOT showing  (need adding to pricing.js)
 *   • codes the site lists that the portal no longer has    (will silently drop)
 *
 * Output: a markdown report to stdout and to $GITHUB_STEP_SUMMARY, plus two
 * $GITHUB_OUTPUT values — `drift_count` and `report_md` — for the workflow to
 * turn into a notification (a GitHub issue, an email, whatever).
 *
 * Needs SUPABASE_URL + SUPABASE_SERVICE_KEY (same as sync-pricing). Without them
 * it exits 0 without reporting, so it can never block anything.
 *
 * Never fails the build: a drift is a prompt for a human, not a deploy blocker.
 */

import { readFileSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const PRICING_JS = resolve(HERE, '../src/data/pricing.js');

// Sellable services deliberately kept off the public pricing page go here, so
// the check does not nag about them. (£0 portal inclusions are ignored anyway.)
const INTENTIONALLY_UNLISTED = new Set([
  // e.g. 'INTERNAL_DRAW_UNIT',
]);

// --- env (mirror sync-pricing's tiny .env.local reader) ---------------------
function loadEnv() {
  try {
    for (const line of readFileSync(resolve(HERE, '../.env.local'), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch { /* no .env.local */ }
}
loadEnv();

const URL_BASE = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;

function setOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  // multiline-safe via a heredoc delimiter
  const d = `__EOF_${name}_${Math.abs(hash(value))}__`;
  appendFileSync(process.env.GITHUB_OUTPUT, `${name}<<${d}\n${value}\n${d}\n`);
}
function summary(md) {
  console.log(md);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n');
}
// tiny deterministic hash for the heredoc delimiter (no Math.random needed)
function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return h; }

if (!URL_BASE || !KEY) {
  console.log('[check-catalogue] SUPABASE_URL / SUPABASE_SERVICE_KEY not set — skipping drift check.');
  setOutput('drift_count', '0');
  process.exit(0);
}

// The codes the website publishes = every `code: '…'` in a pricing.js group.
// Read as text so this stays a plain-node script (pricing.js imports JSON).
function publishedCodes() {
  const src = readFileSync(PRICING_JS, 'utf8');
  const codes = new Set();
  for (const m of src.matchAll(/\bcode:\s*['"]([^'"]+)['"]/g)) codes.add(m[1]);
  return codes;
}

async function table(path) {
  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) throw new Error(`${path} → ${res.status} ${await res.text()}`);
  return res.json();
}

const money = (n) => '£' + Number(n).toLocaleString('en-GB');

try {
  const published = publishedCodes();
  const services = await table(
    'services?active=is.true&select=service_code,title,adhoc_price,price_from,category'
  );

  // Sellable (priced) services the site is not showing → need publishing.
  const unpublished = services
    .filter((s) => Number(s.adhoc_price) > 0)
    .filter((s) => !published.has(s.service_code))
    .filter((s) => !INTENTIONALLY_UNLISTED.has(s.service_code));

  // Codes the site lists but the portal no longer has active → will drop out.
  const liveCodes = new Set(services.map((s) => s.service_code));
  const stale = [...published].filter((c) => !liveCodes.has(c));

  const driftCount = unpublished.length + stale.length;
  setOutput('drift_count', String(driftCount));

  if (driftCount === 0) {
    summary('### ✅ Portal → website: catalogue in sync\nEvery priced portal service is published, and nothing on the site is missing from the portal.');
    setOutput('report_md', '');
    process.exit(0);
  }

  const lines = ['### ⚠️ Portal → website: catalogue drift', ''];
  if (unpublished.length) {
    lines.push(`**${unpublished.length} service(s) in the portal are not on the website.** Add each code to a group in \`src/data/pricing.js\`:`, '');
    lines.push('| Service | Price | Category | Code |', '|---|---|---|---|');
    for (const s of unpublished) {
      lines.push(`| ${s.title} | ${s.price_from ? 'from ' : ''}${money(s.adhoc_price)} | ${s.category ?? '—'} | \`${s.service_code}\` |`);
    }
    lines.push('');
  }
  if (stale.length) {
    lines.push(`**${stale.length} code(s) on the website are no longer active in the portal** (they will drop off the pricing page). Remove or re-point them in \`pricing.js\`:`, '');
    lines.push(stale.map((c) => `\`${c}\``).join(', '), '');
  }
  lines.push('_If a service is intentionally not public, add its code to `INTENTIONALLY_UNLISTED` in `scripts/check-catalogue.mjs` to silence this._');

  const md = lines.join('\n');
  summary(md);
  setOutput('report_md', md);
  process.exit(0);
} catch (err) {
  // A transient portal error must never break the deploy or spam a false alert.
  console.warn('[check-catalogue] skipped — could not read the portal:', err.message);
  setOutput('drift_count', '0');
  process.exit(0);
}
