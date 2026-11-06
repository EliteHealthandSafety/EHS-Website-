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
 * Also pulls the pricing ladder (app_config margin_rules discount fields), the
 * active plan_terms, the band ladder and the rate card's mileage and overnight
 * rates, for the How pricing works page.
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
  const [services, plans, config, vatRaw, zones, marginRules, terms, bandRows, rateCards] = await Promise.all([
    table('services?active=is.true&select=service_code,title,description,category,unit_type,adhoc_price,price_from,member_discount_pct&order=category,sort'),
    table('subscription_plans?active=is.true&status=eq.published&select=plan_code,version,title,blurb,band,base_monthly,min_term_months,is_anchor&order=sort'),
    table('pricing_config?select=key,value'),
    rpc('vat_config'),
    // The contract visit rate: one figure on every zone (the portal's
    // location_zones_one_visit_rate trigger holds them equal). A visit inside a
    // membership programme is priced at this, not at the ad-hoc SITE_VISIT price.
    table('location_zones?select=visit_cost'),
    // The pricing ladder (P70): the member and Managed Service discounts, and the
    // annual prepay discount. The
    // service key reads app_config directly; only the discount fields are kept
    // (the margin floor and the discount authority bands stay internal).
    table('app_config?key=in.(margin_rules,annual_prepay)&select=key,value'),
    // Terms: monthly rolling and 24-month factors (P69).
    table('plan_terms?active=is.true&select=term_months,label,price_factor,allowance_factor&order=sort'),
    // The full band ladder per plan version, for the tier price grid that stays
    // hidden until Reiss turns on showTierPrices (src/data/site.js).
    table('plan_bands?select=plan_code,plan_version,band,min_people,max_people,price,extra_per_person&order=plan_code,sort'),
    // Travel is charged at cost: the mileage and overnight figures on the
    // published rate card. Only those two fields are kept.
    table('rate_cards?status=eq.published&select=params'),
  ]);
  const rates = [...new Set(zones.map((z) => num(z.visit_cost)).filter((v) => v > 0))];
  if (rates.length !== 1) throw new Error(`location_zones carry ${rates.length} visit rates, expected one: ${rates.join(', ')}`);

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

  // A key that is not live yet comes through as null, and the page says less
  // rather than a figure nobody set. Never default a percentage here.
  const cfg = Object.fromEntries(marginRules.map((r) => [r.key, r.value || {}]));
  const mr = cfg.margin_rules || {};
  const byCode = Object.fromEntries(services.map((s) => [s.service_code, s]));
  const pct = (v) => (v === null || v === undefined || v === '' ? null : Number(v));
  const ladder = {
    member_site_pct: pct(mr.member_discount_default_pct),
    // Desk work: a dedicated key if the portal grows one, else the live
    // consultancy row, which carries the desk rate.
    member_desk_pct: pct(mr.member_desk_discount_pct) ?? pct(byCode.CONSULTANCY?.member_discount_pct),
    managed_site_pct: pct(mr.managed_service_discount_pct),
    managed_desk_pct: pct(mr.managed_service_desk_discount_pct),
  };
  const annualPrepayPct = pct(cfg.annual_prepay?.pct);
  const termRows = terms.map((t) => ({
    term_months: num(t.term_months), label: t.label,
    price_factor: num(t.price_factor), allowance_factor: num(t.allowance_factor),
  }));
  const planVersion = Object.fromEntries(plans.map((p) => [p.plan_code, p.version]));
  const bands = bandRows
    .filter((b) => planVersion[b.plan_code] === b.plan_version)
    .map((b) => ({ plan_code: b.plan_code, band: b.band, min_people: b.min_people, max_people: b.max_people,
      price: num(b.price), extra_per_person: num(b.extra_per_person) }));
  const rc = (rateCards[0] && rateCards[0].params) || {};
  const travel = { mileage_rate: num(rc.mileage_rate), overnight_rate: num(rc.overnight_rate) };

  const payload = {
    _comment: previous._comment,
    _source: previous._source,
    generatedAt: new Date().toISOString().slice(0, 10),
    vat,
    contract_visit_rate: rates[0],
    config: Object.fromEntries(config.map((r) => [r.key, num(r.value)])),
    services: services.map((s) => ({
      ...s,
      adhoc_price: num(s.adhoc_price),
      member_discount_pct: num(s.member_discount_pct),
    })),
    plans: plans.map((p) => ({ ...p, base_monthly: num(p.base_monthly) })),
    ladder,
    terms: termRows,
    annual_prepay_pct: annualPrepayPct,
    bands,
    travel,
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

  const pl = previous.ladder || {};
  for (const k of Object.keys(ladder)) {
    if (pl[k] !== ladder[k]) changes.push(`  ladder.${k}: ${pl[k] ?? '—'} → ${ladder[k] ?? 'not set'}`);
  }

  writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n');
  console.log(`[sync:pricing] ${payload.services.length} services, ${payload.plans.length} plans.`);
  console.log(changes.length ? `[sync:pricing] Price changes:\n${changes.join('\n')}` : '[sync:pricing] No price changes.');
} catch (err) {
  console.error('[sync:pricing] FAILED — snapshot left untouched.');
  console.error(err.message);
  process.exit(1);
}
