// Single source of truth for business details.
// Update the TODOs here and every page + the schema updates automatically.
export const business = {
  legalName: 'Elite Health and Safety Ltd',
  name: 'Elite Health & Safety',
  url: 'https://elitehealthandsafety.co.uk',
  email: 'info@elitehealthandsafety.co.uk',
  phone: '+441413450549',        // Glasgow CircleLoop number (national backup: 0333 090 6074)
  phoneDisplay: '0141 345 0549',
  companyNumber: 'SC656384',
  foundingDate: '2026', // Elite H&S Ltd began trading 2026 (Total H&S, est. 2019, was a separate, now-closed company)
  areaServed: ['Glasgow', 'Scotland', 'United Kingdom'],
  priceRange: '££',
  description:
    'Health & safety consultancy and accredited training based in Glasgow, serving businesses across Scotland and UK-wide — fire risk assessments, IOSH & SSSTS courses, first aid, manual handling, CDM and ISO support.',

  // Web3Forms free access key for the contact form (get one at https://web3forms.com
  // using info@elitehealthandsafety.co.uk, then paste it here).
  web3formsKey: 'a5330766-5eb6-4d51-91f9-8ae2b6ec50c4',

  // TODO (from client) — fill these in and the LocalBusiness schema enriches automatically:
  address: {
    streetAddress: '',           // e.g. "123 Example Street"
    addressLocality: 'Glasgow',
    addressRegion: 'Scotland',
    postalCode: '',              // e.g. "G1 1AA"
    addressCountry: 'GB',
  },
  openingHours: null,            // e.g. { days: ['Monday','Tuesday','Wednesday','Thursday','Friday'], opens: '09:00', closes: '17:00' }
  sameAs: [],                    // e.g. ['https://www.facebook.com/...', 'https://www.linkedin.com/company/...', Google Business Profile URL]
};
