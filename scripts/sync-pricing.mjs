#!/usr/bin/env node
/**
 * Refresh src/data/pricing-live.json from the portal's own pricing tables.
 *
 * Prices are set in the portal (Subscription builder → Service catalogue).
 * Run this before a deploy and the website picks up whatever is set there:
 *
 *   npm run sync:pricing
 *   npm run build
 *
 * Needs two env vars (put them in .env.local, which is gitignored):
 *   SUPABASE_URL          https://txkfuodkrssvafxyeskg.supabase.co
 *   SUPABASE_SERVICE_KEY  service_role key from Supabase → Project Settings → API
 *
 * The service_role key is used ONLY here, at build time, and never reaches the
 * browser — `services` and `subscription_plans` are readable by authenticated
 * users only, so an anon key cannot see them and we are not loosening that RLS
 * just to price a marketing page.
 *
 * If the env vars are absent the script exits without touching the file, so a
 * build on a machine without credentials still works from the committed
 * snapshot rather than shipping a page with no prices.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, '../src/data/pricing-live.json');

// Minimal .env.local reader — avoids a dependency for two variables.
function loadEnv() {
  try {
    for (const line of readFileSync(resolve(HERE, '../.env.local'), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    /* no .env.local — fall back to real env vars */
  }
}
loadEnv();

const URL_BASE = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;

if (!URL_BASE || !KEY) {
  console.log('[sync:pricing] SUPABASE_URL / SUPABASE_SERVICE_KEY not set — keeping the existing snapshot.');
  console.log('[sync:pricing] Add them to .env.local to pull live prices from the portal.');
  // Shout if the snapshot is going stale, so an old price list cannot quietly
  // keep shipping build after build.
  try {
    const snap = JSON.parse(readFileSync(OUT, 'utf8'));
    const ageDays = Math.floor((Date.now() - new Date(snap.generatedAt).getTime()) / 86400000);
    if (ageDays >= 30) {
      console.warn(`[sync:pricing] ⚠ Published prices were last synced ${ageDays} days ago (${snap.generatedAt}).`);
      console.warn('[sync:pricing] ⚠ They may no longer match the portal. Add credentials and re-run before deploying.');
    }
  } catch { /* snapshot unreadable — the build will fail loudly anyway */ }
  process.exit(0);
}

async function table(path) {
  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) throw new Error(`${path} → ${res.status} ${await res.text()}`);
  return res.json();
}

// The portal reads VAT through the vat_config() RPC, never the table (app_config
// is staff-only). Same here, so the website applies the SAME treatment the
// portal's own brochure applies — see src/data/pricing.js.
async function rpc(name) {
  const res = await fetch(`${URL_BASE}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (!res.ok) throw new Error(`rpc/${name} → ${res.status} ${await res.text()}`);
  return res.json();
}

const num = (v) => (v === null || v === undefined ? null : Number(v));

try {
  const [services, plans, config, vatRaw] = await Promise.all([
    table('services?active=is.true&select=service_code,title,description,category,unit_type,adhoc_price,price_from,member_discount_pct&order=category,sort'),
    table('subscription_plans?active=is.true&status=eq.published&select=plan_code,title,blurb,band,base_monthly,min_term_months,is_anchor&order=sort'),
    table('pricing_config?select=key,value'),
    rpc('vat_config'),
  ]);

  // An empty object means the 'vat' key is missing from app_config — a
  // configuration problem, not an answer. Refuse rather than publish net prices.
  if (!vatRaw || typeof vatRaw !== 'object' || !Object.keys(vatRaw).length) {
    throw new Error('vat_config() returned nothing — cannot decide how to present prices.');
  }
  // Only the fields the presentation needs. The accountant's note and the
  // registration number stay in the portal.
  const vat = {
    enabled: vatRaw.enabled === true,
    rate: num(vatRaw.rate) ?? 0.2,
    status: vatRaw.status ?? null,
    prices_include_vat: vatRaw.prices_include_vat === true,
  };

  const previous = JSON.parse(readFileSync(OUT, 'utf8'));

  const payload = {
    _comment: previous._comment,
    _source: previous._source,
    generatedAt: new Date().toISOString().slice(0, 10),
    vat,
    config: Object.fromEntries(config.map((r) => [r.key, num(r.value)])),
    services: services.map((s) => ({
      ...s,
      adhoc_price: num(s.adhoc_price),
      member_discount_pct: num(s.member_discount_pct),
    })),
    plans: plans.map((p) => ({ ...p, base_monthly: num(p.base_monthly) })),
  };

  // Report what moved, so a price change is never silent in a deploy log.
  const before = Object.fromEntries(previous.services.map((s) => [s.service_code, s.adhoc_price]));
  const changes = payload.services
    .filter((s) => before[s.service_code] !== s.adhoc_price)
    .map((s) => `  ${s.service_code}: ${before[s.service_code] ?? '—'} → ${s.adhoc_price}`);
  const planBefore = Object.fromEntries(previous.plans.map((p) => [p.plan_code, p.base_monthly]));
  changes.push(
    ...payload.plans
      .filter((p) => planBefore[p.plan_code] !== p.base_monthly)
      .map((p) => `  ${p.plan_code}: ${planBefore[p.plan_code] ?? '—'} → ${p.base_monthly}/mo`)
  );
  const pv = previous.vat || {};
  if (pv.enabled !== vat.enabled || pv.status !== vat.status || pv.rate !== vat.rate) {
    changes.push(`  VAT: ${pv.status ?? '—'}/${pv.enabled ? 'on' : 'off'} → ${vat.status ?? '—'}/${vat.enabled ? 'on' : 'off'} at ${vat.rate}`);
  }

  writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n');
  console.log(`[sync:pricing] ${payload.services.length} services, ${payload.plans.length} plans.`);
  console.log(changes.length ? `[sync:pricing] Price changes:\n${changes.join('\n')}` : '[sync:pricing] No price changes.');
} catch (err) {
  console.error('[sync:pricing] FAILED — snapshot left untouched.');
  console.error(err.message);
  process.exit(1);
}
