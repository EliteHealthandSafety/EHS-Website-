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
  foundingDate: '2019-01-07',
  areaServed: ['Glasgow', 'Scotland'],
  priceRange: '££',
  description:
    'Health & safety consultancy and accredited training in Glasgow and across Scotland — fire risk assessments, IOSH & SSSTS courses, first aid, manual handling, CDM and ISO support.',

  // Web3Forms free access key for the contact form (get one at https://web3forms.com
  // using info@elitehealthandsafety.co.uk, then paste it here).
  web3formsKey: 'YOUR_WEB3FORMS_ACCESS_KEY',

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
