import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import adapter from "@sveltejs/adapter-auto";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter(),
		experimental: {
			remoteFunctions: true
		},
		alias: {
			$server: "./src/lib/server",
			"$server/*": "./src/lib/server/*",
			"$client/*": "./src/lib/client/*",
			"$convex/*": "./src/convex/_generated/*"
		}
	},
	compilerOptions: {
		experimental: {
			async: true
		}
	}
};

export default config;
