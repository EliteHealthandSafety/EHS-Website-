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
  process.exit(0);
}

async function table(path) {
  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) throw new Error(`${path} → ${res.status} ${await res.text()}`);
  return res.json();
}

const num = (v) => (v === null || v === undefined ? null : Number(v));

try {
  const [services, plans, config] = await Promise.all([
    table('services?active=is.true&select=service_code,title,description,category,unit_type,adhoc_price,price_from,member_discount_pct&order=category,sort'),
    table('subscription_plans?active=is.true&status=eq.published&select=plan_code,title,blurb,band,base_monthly,min_term_months,is_anchor&order=sort'),
    table('pricing_config?select=key,value'),
  ]);

  const previous = JSON.parse(readFileSync(OUT, 'utf8'));

  const payload = {
    _comment: previous._comment,
    _source: previous._source,
    generatedAt: new Date().toISOString().slice(0, 10),
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

  writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n');
  console.log(`[sync:pricing] ${payload.services.length} services, ${payload.plans.length} plans.`);
  console.log(changes.length ? `[sync:pricing] Price changes:\n${changes.join('\n')}` : '[sync:pricing] No price changes.');
} catch (err) {
  console.error('[sync:pricing] FAILED — snapshot left untouched.');
  console.error(err.message);
  process.exit(1);
}
