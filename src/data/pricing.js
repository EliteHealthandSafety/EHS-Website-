// Indicative public pricing.
//
// SOURCE: Elite_HS_Service_Brochure_2026.pdf ("Services & Indicative Costs",
// 2026 Edition) — the commercial position we publish. All figures EXCLUDE VAT.
//
// ⚠ KNOWN DIVERGENCE (17 Aug 2026): the live Supabase pricing tables that drive
// the portal, quotes and booking hold materially different ad-hoc figures — e.g.
// services.adhoc_price has FRA Small £350 / Medium £650 / Large £950 and site
// visit £250, against £815 / £2,270 / £610 here. Those DB values look like the
// illustrative design-stage numbers, not the 2026 commercial ones. The
// membership tiers DO match the DB exactly (82 / 300 / 699 / 1301).
// Until the DB is reconciled to this brochure, the site advertises prices the
// portal will not charge. Do not "fix" one side without deciding which is right.
//
// Minimum terms come from subscription_plans.min_term_months in the live DB.

export const vatNote = 'All prices exclude VAT.';

export const serviceGroups = [
  {
    id: 'assessments',
    title: 'Risk assessments, inspections & audits',
    blurb: 'Identify the hazards, evidence your compliance, and keep your people safe.',
    priceLabel: 'From (ex VAT)',
    items: [
      {
        name: 'Fire Risk Assessment — small / standard premises',
        detail: 'Single office, shop or unit; site visit plus written report.',
        price: 815,
      },
      {
        name: 'Fire Risk Assessment — large / complex premises',
        detail: 'Multi-storey, HMO or industrial; detailed assessment & action plan.',
        price: 2270,
      },
      {
        name: 'Site inspection / safety visit',
        detail: 'Per visit (1–2 hrs) — routine safety check with a prioritised report to action.',
        price: 610,
      },
      {
        name: 'Full H&S management system audit',
        detail: 'In-depth review of your whole H&S system — scoped to your organisation, typically annual.',
        price: 1220,
      },
      {
        name: 'Legionella risk assessment',
        detail: 'Water systems assessment with compliant records.',
        price: 610,
      },
      {
        name: 'Incident / accident investigation',
        detail: 'Per day — root-cause analysis & corrective-action report.',
        price: 905,
      },
    ],
  },
  {
    id: 'documentation',
    title: 'Policies & documentation',
    blurb: "The paperwork that proves you're compliant — written clearly and kept current.",
    priceLabel: 'From (ex VAT)',
    items: [
      {
        name: 'Health & Safety Policy + arrangements',
        detail: 'Full policy statement, organisation & arrangements, for new or refreshed clients.',
        price: 1360,
      },
      {
        name: 'Bespoke Risk Assessment / Method Statement (RAMS)',
        detail: 'Each — task-specific, site-specific documentation.',
        price: 365,
      },
      {
        name: 'SSIP accreditation support (CHAS, SafeContractor, etc.)',
        detail: 'Full submission preparation & evidence pack.',
        price: 815,
      },
      {
        name: 'CDM 2015 advisory',
        detail: 'Per day — PD / PC duties, pre-construction information & phase plans.',
        price: 905,
      },
      {
        name: 'ISO 45001 implementation',
        detail: 'Full management-system project, scoped to your organisation.',
        price: 7255,
      },
    ],
  },
  {
    id: 'training',
    title: 'Training',
    blurb: 'Accredited and bespoke courses, delivered at your premises or ours.',
    priceLabel: 'Per delegate (ex VAT)',
    items: [
      { name: 'IOSH Managing Safely', detail: '3-day accredited course for supervisors & managers.', price: 375 },
      { name: 'IOSH Working Safely', detail: '1-day accredited course for all staff.', price: 125 },
      { name: 'Emergency First Aid at Work', detail: '1-day certificated course.', price: 105 },
      { name: 'Manual Handling', detail: 'Half-day practical course.', price: 49 },
      { name: 'Fire Marshal / Fire Warden', detail: 'Half-day certificated course.', price: 49 },
      {
        name: 'Bespoke on-site training day',
        detail: 'Per day at your premises — tailored to your risks (group rate, not per delegate).',
        price: 975,
        perDay: true,
      },
    ],
    footnote:
      'Accredited courses are priced per delegate and subject to minimum and maximum class sizes.',
  },
];

export const tiers = [
  {
    code: 'ESSENTIALS',
    name: 'Essentials',
    tagline: 'Cover the basics',
    price: 82,
    minTermMonths: 0,
    who: 'Small businesses that need to stay compliant with expert help on call, without a big monthly commitment.',
    portal: 'Core portal — dashboard, documents & booking',
    includes: [
      'H&S advice line (phone & email)',
      'Annual site inspection & report',
      'Annual H&S policy review',
      'Document & RAMS template library',
      'In-house & accredited training at member rates',
      'Member rates on all additional work',
    ],
  },
  {
    code: 'PLUS',
    name: 'Plus',
    tagline: 'Stay on top of it',
    price: 300,
    minTermMonths: 12,
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
  {
    code: 'COMPLETE',
    name: 'Complete',
    tagline: 'Proactively managed',
    price: 699,
    minTermMonths: 12,
    popular: true,
    who: 'Businesses that want H&S proactively managed, with a named consultant and an annual system audit.',
    portal: 'Portal + subcontractor management & permits',
    includes: [
      'Everything in Plus',
      'Weekly site inspections & reports',
      'Annual full-system audit',
      '1 fire risk assessment per year',
      'Premium assessments included (e.g. Legionella)',
      '2 in-house training days per year',
      'Named consultant + priority response',
    ],
  },
  {
    code: 'MANAGED',
    name: 'Managed',
    tagline: 'Fully outsourced',
    price: 1301,
    minTermMonths: 12,
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
];

export const howItWorks = [
  { no: '1', title: 'Quick scoping call', text: 'A short conversation about your sites, sector and obligations — no charge.' },
  { no: '2', title: 'Clear fixed quote', text: 'A written proposal with the exact scope and price, drawn from this guide.' },
  { no: '3', title: 'Delivery & report', text: 'We carry out the work and hand over clear, audit-ready documentation.' },
  { no: '4', title: 'Ongoing support', text: 'Keep us on hand for advice and renewals — ad-hoc or on an Elite Assured membership.' },
];
