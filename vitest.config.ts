/// <reference types="vitest" />
import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit({ hot: !process.env.VITEST })],
	test: {
		globals: true,
		threads: false
	}
};

export default config;

