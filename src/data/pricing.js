// PUBLIC PRICING - presentation layer only.
//
// ⚠ NO PRICES LIVE IN THIS FILE. Every figure comes from pricing-live.json,
// which is generated from the portal's own tables (services, subscription_plans)
// by `npm run sync:pricing`. Prices are set in the portal - Subscription builder
// → Service catalogue → Edit - and the website follows.
//
// This file decides only:
//   • which services are shown publicly (the catalogue also holds internal
//     draw-units and £0 portal inclusions that don't belong on a sales page)
//   • the public-facing wording, where the internal title is unclear ("... pp")
//   • how each unit_type reads to a customer
//
// To publish a new service: set its price in the portal, run the sync, then add
// its service_code to a group below.
//
// VAT. Catalogue prices are stored NET. The public figure follows the portal's
// own brochure (ehs-app src/lib/vat.js withVat + SalesCollateral adhocCell):
//   • registering window (status 'registering', enabled false): the figure is
//     RAISED by the VAT amount and shown as a single price with no VAT wording,
//     as HMRC requires until the registration number arrives.
//   • VAT enabled: the stored net, and the page says "ex VAT".
//   • VAT off: the stored net, no VAT wording.
// The snapshot carries `vat` from the vat_config() RPC, so the nightly sync
// moves the site with the portal when the number arrives.

import live from './pricing-live.json';

const byCode = Object.fromEntries(live.services.map((s) => [s.service_code, s]));

// Missing config fails CLOSED (VAT on), as the portal does: a wrong price in
// that direction overstates, which someone reports; understating is never seen.
const VAT = live.vat && typeof live.vat === 'object' && Object.keys(live.vat).length
  ? live.vat
  : { enabled: true, rate: 0.2, status: null, prices_include_vat: false };

export const vatRegistering = !VAT.enabled && VAT.status === 'registering';
export const vatEnabled = VAT.enabled === true;
export const vatPctLabel = Math.round((Number(VAT.rate) || 0.2) * 100) + '%';

// The figure the public sees for a stored net price. Mirrors withVat().net.
export function displayPrice(net) {
  const n = Number(net) || 0;
  if (vatRegistering) {
    const r = Number(VAT.rate) || 0.2;
    return VAT.prices_include_vat ? n : n * (1 + r);
  }
  return n;
}

// Same formatter as the brochure (subscriptionModel.js gbp): whole pounds.
export const gbp = (n) =>
  '£' + (Number(n) || 0).toLocaleString('en-GB', { maximumFractionDigits: 0 });

// unit_type in the DB → how it should read on a public page
const UNIT_LABEL = {
  Count: 'each',
  Hours: 'per hour',
  'Person-days': 'per day',
  'GBP-pot': 'per visit',
};

// Public groups. `code` must match services.service_code exactly.
// `name`/`detail` override the internal title/description only where needed.
const GROUPS = [
  {
    id: 'fire',
    title: 'Fire risk assessments',
    blurb:
      'Assessed to the PAS 79 standard and priced by the size and complexity of your premises, so you pay for the building you actually have.',
    items: [
      // One catalogue line since the FRA estimator (Sep 2026): priced per
      // building on its recorded facts, no fixed small/medium/large bands.
      { code: 'FRA', name: 'Fire Risk Assessment', unit: 'per building' },
    ],
  },
  {
    id: 'assessments',
    title: 'Assessments & site inspections',
    blurb: 'Identify the hazards, evidence your compliance, and keep your people safe.',
    items: [
      // P72: from £365 since migration 843 (price_from true): the journey at cost,
      // a larger site quoted up. Read from the sync, never typed.
      { code: 'SITE_VISIT', unit: 'per site address',
        detail: 'One site address, one report. The journey is added at cost beyond 25 miles of Clydebank; a larger site is quoted up before you accept.' },
      // No 'INSPECTION_DAY': it is not a client-facing product (DECISIONS P64(13)).
      { code: 'GEN_RA' },
      { code: 'COSHH' },
      { code: 'DSE', name: 'DSE workstation assessment' },
      { code: 'LEGIONELLA' },
      { code: 'SPECIALIST' },
      // Catalogue description: "up to 10 people a visit".
      { code: 'DRUG_ALCOHOL', unit: 'per visit' },
    ],
  },
  {
    id: 'documentation',
    title: 'Policies, documents & advice',
    blurb: "The paperwork that proves you're compliant, written clearly and kept current.",
    items: [
      { code: 'POLICY_REVIEW' },
      { code: 'RAMS_REVIEW' },
      { code: 'MGMT_REVIEW' },
      { code: 'INCIDENT' },
      { code: 'CONSULTANCY' },
      { code: 'CDM' },
      { code: 'ISO_PQQ', name: 'ISO standards & PQQ support' },
      { code: 'ISO_AUDIT' },
    ],
  },
  {
    id: 'training',
    title: 'Training',
    blurb: 'Accredited and bespoke courses, delivered at your premises or ours.',
    items: [
      // The catalogue descriptions for these two name an awarding body Elite is
      // not accredited by, so the site overrides them with plain wording.
      { code: 'SPECIALIST TRAINING', name: 'Emergency First Aid at Work (1 day)', unit: 'per delegate',
        detail: 'Emergency first aid training, including defibrillator use, with a certificate on completion' },
      { code: 'FIRST AID AT WORK', name: 'First Aid at Work (3 day)', unit: 'per delegate',
        detail: 'First aid training with a certificate on completion: defibrillator use, resuscitation, recovery position, bandaging, choking, asthma and anaphylaxis' },
      { code: 'TRAINING_DAY', name: 'On-site training day', unit: 'per trainer day' },
      { code: 'TBT_BESPOKE', name: 'Toolbox talk written to your brief', unit: 'each' },
    ],
    // No accreditation body is named here: IIRSM approval lapsed and is not
    // re-granted, so the site must not badge courses with it.
    footnote:
      'Accredited courses are subject to minimum and maximum class sizes. An on-site training day covers Manual Handling, Fire Awareness, Work at Height, Abrasive Wheels or Asbestos Awareness.',
  },
];

// Resolve each group against the live data. A code with no matching live row is
// dropped rather than rendered priceless - and reported, so it is not silent.
export const missingCodes = [];

export const serviceGroups = GROUPS.map((g) => ({
  ...g,
  items: g.items
    .map((item) => {
      const row = byCode[item.code];
      if (!row) {
        missingCodes.push(item.code);
        return null;
      }
      const label = UNIT_LABEL[row.unit_type] ?? '';
      return {
        code: item.code,
        name: item.name || row.title,
        detail: item.detail || row.description || '',
        // The public figure, never the raw net - see the VAT note above.
        price: displayPrice(row.adhoc_price),
        net: row.adhoc_price,
        from: row.price_from,
        // ?? not || so an explicit '' can suppress a misleading unit. As in the
        // brochure, a "from" price drops a bare "each".
        unit: item.unit ?? (row.price_from && label === 'each' ? '' : label),
        memberDiscountPct: row.member_discount_pct,
      };
    })
    .filter(Boolean),
})).filter((g) => g.items.length);

// Membership tiers, straight from subscription_plans. Copy that the DB does not
// hold (who it suits, what's included) lives here, keyed by plan_code.
const TIER_COPY = {
  ESSENTIALS: {
    tagline: 'Cover the basics',
    who: 'Small businesses that need to stay compliant with expert help on call, without a big monthly commitment.',
    portal: 'Core portal: dashboard, documents & booking',
    includes: [
      'H&S advice line (phone & email)',
      'Annual site inspection & report',
      'Annual H&S policy review',
      'Document & RAMS template library',
      'Training at member rates',
      'Member rates on all additional work',
    ],
  },
  PLUS: {
    tagline: 'Stay on top of it',
    who: 'Growing businesses that want regular proactive checks and their paperwork actively managed.',
    portal: 'Core portal + training management',
    includes: [
      'Everything in Essentials',
      'Fortnightly site inspections & reports',
      '2 bespoke RAMS per year',
      '1 in-house training day per year',
      'Priority advice line',
    ],
  },
  COMPLETE: {
    tagline: 'Proactively managed',
    who: 'Businesses that want H&S proactively managed, with a named consultant and an annual system audit.',
    portal: 'Portal + subcontractor management & permits',
    includes: [
      'Everything in Plus',
      'Weekly site inspections & reports',
      'Annual full-system audit',
      '1 fire risk assessment per year',
      'Premium assessments included',
      '2 in-house training days per year',
      'Named consultant + priority response',
    ],
  },
  MANAGED: {
    tagline: 'Fully outsourced',
    who: 'Organisations outsourcing their H&S function across one or more sites.',
    portal: 'Full portal: all users & all sites',
    includes: [
      'Everything in Complete',
      'We act as your competent person, end to end',
      'Weekly inspections across multiple sites',
      'Annual audit + fire risk assessments across sites',
      '4 in-house training days per year',
      'Named lead consultant + priority response',
    ],
  },
};

export const tiers = live.plans.map((p) => ({
  code: p.plan_code,
  name: p.title,
  price: displayPrice(p.base_monthly),
  minTermMonths: p.min_term_months,
  popular: p.is_anchor,
  blurb: p.blurb,
  ...(TIER_COPY[p.plan_code] || {}),
}));

// The best member discount on the catalogue. Discounts vary by service, so the
// page phrases it as "up to X%". null only if nothing is discounted.
const discounts = live.services.map((s) => s.member_discount_pct).filter((d) => d > 0);
export const memberDiscountPct = discounts.length ? Math.max(...discounts) : null;

// The rate a site inspection is priced at inside a membership programme, from
// the portal's location_zones (one rate on every zone). Null if the snapshot
// predates it, and the page then says nothing rather than a stale figure.
export const contractVisitRate = Number(live.contract_visit_rate) || null;
export const adhocVisitRate = byCode.SITE_VISIT ? byCode.SITE_VISIT.adhoc_price : null;

export const vatPct = live.config.vat_pct;
export const pricesGeneratedAt = live.generatedAt;

export const howItWorks = [
  { no: '1', title: 'Quick scoping call', text: 'A short conversation about your sites, sector and obligations, at no charge.' },
  { no: '2', title: 'Clear fixed quote', text: 'A written proposal with the exact scope and price, drawn from these rates.' },
  { no: '3', title: 'Delivery & report', text: 'We carry out the work and hand over clear, audit-ready documentation.' },
  { no: '4', title: 'Ongoing support', text: 'Keep us on hand for advice and renewals, pay as you go or on a Lanyard membership.' },
];

// ---------------------------------------------------------------------------
// THE PRICING LADDER (P70, 6 Nov 2026): pay as you go pays the rate card; every
// Lanyard member (Lite, Standard, Pro, on a term or monthly rolling) pays member
// rates; an Elite Managed Service client pays less again on work beyond its plan.
//
// No percentage is typed here. Each comes from pricing-live.json:
//   ladder.*   app_config margin_rules, read by scripts/sync-pricing.mjs
//   fallback   the catalogue rows already in the snapshot (SITE_VISIT for site
//              work, CONSULTANCY for desk work), so a snapshot taken before the
//              sync learned about margin_rules still states the member rates.
// The Managed Service discount has no fallback: until the portal holds it, the
// page shows the member rate only and says the Managed Service rate is quoted.
// TODO(P70): app_config margin_rules needs managed_service_discount_pct (site,
// 20 per P70) and managed_service_desk_discount_pct (desk, 17) before the site
// can state them. Add them in the portal, re-run the sync, and the page follows.
// ---------------------------------------------------------------------------
const L = live.ladder || {};
const n = (v) => (v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v));
export const ladder = {
  memberSitePct: n(L.member_site_pct) ?? n(byCode.SITE_VISIT?.member_discount_pct),
  memberDeskPct: n(L.member_desk_pct) ?? n(byCode.CONSULTANCY?.member_discount_pct),
  managedSitePct: n(L.managed_site_pct),
  managedDeskPct: n(L.managed_desk_pct),
};
// P72 (Reiss, 7 Nov 2026, as corrected): site inspections are not on the Managed
// Service percentage. Each inspection in the plan is the contract visit rate
// (location_zones.visit_cost, synced: £300 today); one beyond the plan is the
// member rate. The percentages apply to all other work.
export const ladderHasManaged = ladder.managedSitePct != null && ladder.managedDeskPct != null;

const less = (price, pct) => (price == null || pct == null ? null : Math.round(price * (100 - pct)) / 100);
const svc = (code) => byCode[code] || null;

// Example rates for the ladder table, from the live catalogue. Every figure is
// the public display price (see displayPrice above), net.
function exampleRow(code, label, kind) {
  const row = svc(code);
  if (!row) return null;
  const base = Number(row.adhoc_price);
  const pctM = kind === 'desk' ? ladder.memberDeskPct : ladder.memberSitePct;
  const pctX = kind === 'desk' ? ladder.managedDeskPct : ladder.managedSitePct;
  const member = less(displayPrice(base), pctM);
  const siteInspection = code === 'SITE_VISIT';
  return {
    code, label, from: !!row.price_from, siteInspection,
    payg: displayPrice(base),
    member,
    // A site inspection: the plan rate, and the member rate beyond the plan.
    managed: siteInspection ? null : ladderHasManaged ? less(displayPrice(base), pctX) : null,
    managedInPlan: siteInspection && contractVisitRate ? displayPrice(contractVisitRate) : null,
    managedBeyond: siteInspection ? member : null,
  };
}
export const ladderExamples = [
  exampleRow('SITE_VISIT', 'Site inspection', 'site'),
  exampleRow('CONSULTANCY', 'Consultancy, an hour', 'desk'),
  exampleRow('FRA', 'Fire risk assessment, per building', 'site'),
].filter(Boolean);

// Pence, for prices that are not whole pounds (member rates usually are not).
export const gbp2 = (v) =>
  '£' + (Number(v) || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Terms (P69), from plan_terms. null until the sync has run with the new fields,
// and the page then words the term without a figure.
const termBy = Object.fromEntries((live.terms || []).map((t) => [t.term_months, t]));
const pctOver = (f) => (f == null ? null : Math.round((Number(f) - 1) * 100));
export const terms = {
  rollingPct: pctOver(termBy[1]?.price_factor),
  extraAllowance24Pct: pctOver(termBy[24]?.allowance_factor),
  annualPrepayPct: n(live.annual_prepay_pct),
};

// Travel (P9, P10): charged at cost, never discounted. The mileage and overnight
// rates come from the published rate card via the sync (overnight also from
// pricing_config, already in the snapshot). The two distances are the rule
// itself, not prices; they are named here because the portal does not publish
// them as config yet.
// TODO(P9/P10): sync the home radius (client_subscriptions.home_radius_miles
// default) and the 120-mile night threshold once the portal exposes them.
export const travel = {
  homeRadiusMiles: 25,
  nightBeyondMiles: 120,
  mileagePence: live.travel?.mileage_rate != null ? Math.round(Number(live.travel.mileage_rate) * 100) : null,
  overnight: n(live.travel?.overnight_rate) ?? n(live.config?.overnight_rate),
};

// Tier prices, from plan_bands via the sync. The full grid shows only with
// showTierPrices; the "from" price (showTierFromPrices, P72) is the LOWEST band
// price of the tier's live version, falling back to base_monthly (the band A
// headline) only when the snapshot predates the band sync.
const TIER_ORDER = ['LITE', 'STANDARD', 'PRO'];
const TIER_NAME = { LITE: 'Lanyard Lite', STANDARD: 'Lanyard Standard', PRO: 'Lanyard Pro' };
export const tierBands = TIER_ORDER.map((code) => {
  const plan = live.plans.find((p) => p.plan_code === code);
  if (!plan) return null;
  const rows = (live.bands || []).filter((b) => b.plan_code === code);
  return {
    code, name: TIER_NAME[code],
    fromPrice: displayPrice(rows.length ? Math.min(...rows.map((b) => Number(b.price))) : plan.base_monthly),
    bands: rows.map((b) => ({ ...b, price: displayPrice(b.price) })),
  };
}).filter(Boolean);
