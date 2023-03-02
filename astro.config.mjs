import { defineConfig } from 'astro/config'; // import tailwind from '@astrojs/tailwind';

import svelte from '@astrojs/svelte';

import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
	integrations: [svelte(), tailwind({ config: { applyBaseStyles: false } })],
	markdown: { syntaxHighlight: 'prism' },
});
