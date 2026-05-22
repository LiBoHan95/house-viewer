/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				zone: {
					a: '#4A90D9',
					b: '#5C9E5A',
					c: '#E8833A',
					south: '#D94A4A',
					north: '#8E6BBF'
				}
			}
		}
	},
	plugins: []
};
