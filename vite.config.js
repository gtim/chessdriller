import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()],
	test: {
		deps: {
			inline: [ "cm-chess" ]
		},
	}
};

export default config;
