import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: 'https://stack0.vercel.app',

  markdown: {
    shikiConfig: {
        theme: 'github-dark',
        wrap: false
    }
  },

  integrations: [sitemap()]
})