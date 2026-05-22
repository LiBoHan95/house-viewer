import adapter from '@sveltejs/adapter-static';

const config = {
	compilerOptions: {
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		adapter: adapter({
			// SPA mode: fallback to index.html for all routes
			fallback: 'index.html'
		})
	}
};

export default config;
