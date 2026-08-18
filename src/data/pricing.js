// PUBLIC PRICING — presentation layer only.
//
// ⚠ NO PRICES LIVE IN THIS FILE. Every figure comes from pricing-live.json,
// which is generated from the portal's own tables (services, subscription_plans)
// by `npm run sync:pricing`. Prices are set in the portal — Subscription builder
// → Service catalogue → Edit — and the website follows.
//
// This file decides only:
//   • which services are shown publicly (the catalogue also holds internal
//     draw-units and £0 portal inclusions that don't belong on a sales page)
//   • the public-facing wording, where the internal title is unclear ("... pp")
//   • how each unit_type reads to a customer
//
// To publish a new service: set its price in the portal, run the sync, then add
// its service_code to a group below.

import live from './pricing-live.json';

const byCode = Object.fromEntries(live.services.map((s) => [s.service_code, s]));

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
      'Assessed to the PAS 79 standard and priced by the size and complexity of your premises — so you pay for the building you actually have.',
    items: [
      { code: 'FRA SMALL', name: 'Fire Risk Assessment — small premises' },
      { code: 'FRA MEDIUM', name: 'Fire Risk Assessment — medium premises' },
      { code: 'FRA', name: 'Fire Risk Assessment — large premises' },
    ],
  },
  {
    id: 'assessments',
    title: 'Assessments & site inspections',
    blurb: 'Identify the hazards, evidence your compliance, and keep your people safe.',
    items: [
      { code: 'SITE_VISIT' },
      { code: 'GEN_RA' },
      { code: 'COSHH' },
      { code: 'DSE', name: 'DSE workstation assessment', unit: 'per person' },
      { code: 'LEGIONELLA' },
      { code: 'SPECIALIST' },
      { code: 'DRUG_ALCOHOL', name: 'Drug & alcohol testing', unit: 'per person' },
    ],
  },
  {
    id: 'documentation',
    title: 'Policies, documents & advice',
    blurb: "The paperwork that proves you're compliant — written clearly and kept current.",
    items: [
      { code: 'POLICY_REVIEW' },
      { code: 'RAMS_REVIEW' },
      { code: 'MGMT_REVIEW' },
      // unit_type is "Hours" in the catalogue but £480 is clearly a job price,
      // not an hourly rate — shown without a unit so we don't advertise £480/hr.
      // Worth correcting the unit in the portal.
      { code: 'INCIDENT', unit: '' },
      { code: 'CONSULTANCY' },
      { code: 'CDM' },
      { code: 'ISO_PQQ', name: 'ISO standards & PQQ support', unit: '' },
    ],
  },
  {
    id: 'training',
    title: 'Training',
    blurb: 'Accredited and bespoke courses, delivered at your premises or ours.',
    items: [
      { code: 'SPECIALIST TRAINING', name: 'Emergency First Aid at Work (1 day)', unit: 'per delegate' },
      { code: 'FIRST AID AT WORK', name: 'First Aid at Work (3 day)', unit: 'per delegate' },
      { code: 'TRAINING_DAY', name: 'On-site training day', unit: 'per trainer day' },
      { code: 'TOOLBOX', name: 'Toolbox talk', unit: 'each' },
    ],
    footnote:
      'Accredited courses are subject to minimum and maximum class sizes. An on-site training day covers Manual Handling, Fire Awareness, Work at Height, Abrasive Wheels or Asbestos Awareness (IIRSM certified).',
  },
];

// Resolve each group against the live data. A code with no matching live row is
// dropped rather than rendered priceless — and reported, so it is not silent.
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
      return {
        code: item.code,
        name: item.name || row.title,
        detail: item.detail || row.description || '',
        price: row.adhoc_price,
        from: row.price_from,
        // ?? not || so an explicit '' can suppress a misleading unit
        unit: item.unit ?? UNIT_LABEL[row.unit_type] ?? '',
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
    portal: 'Core portal — dashboard, documents & booking',
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
    portal: 'Full portal — all users & all sites',
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
  price: p.base_monthly,
  minTermMonths: p.min_term_months,
  popular: p.is_anchor,
  blurb: p.blurb,
  ...(TIER_COPY[p.plan_code] || {}),
}));

// The best member discount on the catalogue. Discounts vary by service, so the
// page phrases it as "up to X%". null only if nothing is discounted.
const discounts = live.services.map((s) => s.member_discount_pct).filter((d) => d > 0);
export const memberDiscountPct = discounts.length ? Math.max(...discounts) : null;

export const vatPct = live.config.vat_pct;
export const pricesGeneratedAt = live.generatedAt;

export const howItWorks = [
  { no: '1', title: 'Quick scoping call', text: 'A short conversation about your sites, sector and obligations — no charge.' },
  { no: '2', title: 'Clear fixed quote', text: 'A written proposal with the exact scope and price, drawn from these rates.' },
  { no: '3', title: 'Delivery & report', text: 'We carry out the work and hand over clear, audit-ready documentation.' },
  { no: '4', title: 'Ongoing support', text: 'Keep us on hand for advice and renewals — ad-hoc or on an Elite Assured membership.' },
];
