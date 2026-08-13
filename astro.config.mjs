// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://elitehealthandsafety.co.uk',
  integrations: [sitemap()],
  redirects: {
    // Duplicate CITB posts consolidated into the fullest one
    '/citb-health-and-safety-awareness-in-glasgow-2-2/':
      '/citb-health-and-safety-awareness-in-glasgow/',
    '/citb-health-and-safety-awareness-in-glasgow-6/':
      '/citb-health-and-safety-awareness-in-glasgow/',
    // Old WordPress pages that no longer exist
    '/portfolio/': '/about-us/',
    '/sample-page/': '/',
  },
});
