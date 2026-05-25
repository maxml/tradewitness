import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/data/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			fontFamily: {
				sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
				mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
			},
			colors: {
				background: 'hsl(var(--background) / <alpha-value>)',
				foreground: 'hsl(var(--foreground) / <alpha-value>)',
				card: {
					DEFAULT: 'hsl(var(--card) / <alpha-value>)',
					foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
				},
				'card-alt': 'hsl(var(--card-alt) / <alpha-value>)',
				primary: {
					DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
					foreground: 'hsl(var(--primary-fg) / <alpha-value>)'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
					foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
					foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
				},
				destructive: 'hsl(var(--destructive) / <alpha-value>)',
				success: 'hsl(var(--success) / <alpha-value>)',
				border: 'hsl(var(--border) / <alpha-value>)',
				input: 'hsl(var(--input) / <alpha-value>)',
				ring: 'hsl(var(--ring) / <alpha-value>)',
				
				legacyPrimary: 'var(--legacy-primary)',
				darkPrimary: 'var(--darkPrimary)',
				secondary: 'var(--secondary)',
				tertiary: 'var(--tertiary)',
				claude: 'var(--claude)',
				claudeBackground: 'var(--claudeBackground)',
				buy: 'var(--buy)',
				buyWithOpacity: 'var(--buyOpacity)',
				buyLight: 'var(--buyLight)',
				sell: 'var(--sell)',
				sellWithOpacity: 'var(--sellOpacity)',
				sellLight: 'var(--sellLight)',
				customBlue: 'var(--customBlue)',
				customOrange: 'var(--customOrange)',
				customYellow: 'var(--customYellow)'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			},
			gridTemplateColumns: {
				'40': 'repeat(40, minmax(0, 1fr))',
				'33': 'repeat(33, minmax(0, 1fr))',
				'27': 'repeat(27, minmax(0, 1fr))',
				'20': 'repeat(20, minmax(0, 1fr))'
			}
		}
	},
	plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
