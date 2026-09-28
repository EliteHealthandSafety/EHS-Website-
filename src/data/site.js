// Single source of truth for business details.
// Update the TODOs here and every page + the schema updates automatically.
export const business = {
  legalName: 'Elite Health & Safety Ltd',
  name: 'Elite Health & Safety',
  url: 'https://elitehealthandsafety.co.uk',
  email: 'info@elitehealthandsafety.co.uk',
  phone: '+441413450549',        // Glasgow CircleLoop number (national backup: 0333 090 6074)
  phoneDisplay: '0141 345 0549',
  companyNumber: 'SC878365',
  // HMRC VAT registration, effective 1 July 2026 (HMRC letter 10 Sep 2026).
  // Printed in the footer and privacy notice; vatID in the schema drops the spaces.
  vatNumber: 'GB 527 9774 38',
  // Registered office per Companies House — a required disclosure on the site
  // (EHS-BR-001-A W3). Distinct from the schema address below: Elite is still a
  // service-area business and the registered office is already public register data.
  registeredOffice: '443 Dumbarton Road, Clydebank, G81 4DU',
  foundingDate: '2026', // Elite H&S Ltd began trading 2026 (Total H&S, est. 2019, was a separate, now-closed company)
  areaServed: ['Glasgow', 'Scotland', 'United Kingdom'],
  priceRange: '££',
  description:
    'Health & safety consultancy and accredited training based in Glasgow, serving businesses across Scotland and UK-wide — fire risk assessments, IOSH & SSSTS courses, first aid, manual handling, CDM and ISO support.',

  // Web3Forms free access key for the contact form (get one at https://web3forms.com
  // using info@elitehealthandsafety.co.uk, then paste it here).
  web3formsKey: 'a5330766-5eb6-4d51-91f9-8ae2b6ec50c4',

  // Elite is a SERVICE-AREA business: we travel to the client, there is no
  // premises the public visits. The only address on file is a home address, so
  // street and postcode are deliberately left blank and are NOT stored in this
  // repo. Locality/region alone still gives search engines the local signal
  // without publishing where someone lives.
  // If a real business/visiting address is taken on later, fill these in.
  serviceAreaBusiness: true,
  address: {
    streetAddress: '',
    addressLocality: 'Glasgow',
    addressRegion: 'Scotland',
    postalCode: '',
    addressCountry: 'GB',
  },

  openingHours: {
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '07:00',
    closes: '18:00',
  },
  openingHoursDisplay: 'Mon–Fri, 7am–6pm',

  // Add a URL here and it appears as a footer icon AND in the schema's sameAs
  // automatically. Leave blank to hide.
  social: {
    facebook: 'https://www.facebook.com/profile.php?id=61593352649838',
    linkedin: 'https://www.linkedin.com/company/elite-health-and-safety-scotland/',
    instagram: '',
    // Same short link without /review resolves to the Business Profile itself.
    googleBusiness: 'https://g.page/r/CeBBieFFzzrEEBM',
  },

  // Deep link that opens the "write a review" box on the Google Business
  // Profile. Used for review CTAs, not for schema sameAs.
  reviewUrl: 'https://g.page/r/CeBBieFFzzrEEBM/review',
};

// Schema sameAs is derived, so there is only one place to keep up to date.
business.sameAs = Object.values(business.social).filter(Boolean);
