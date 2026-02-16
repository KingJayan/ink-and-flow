/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./App.tsx",
        "./index.tsx"
    ],
    theme: {
        extend: {
            colors: {
                desk: '#F0EFE9',      // Slightly darker, warmer grey - The Desk
                paper: '#FDFBF7',     // Bright warm white - The Sheet
                ink: '#2D2D2D',       // Charcoal - The Text
                'ink-faint': '#6B7072', // Medium Grey (WCAG AA Compliant)
                sage: '#98A8A2',      // Sage Green
                navy: '#39404E',      // Deep Navy
                'wash-beige': '#E8E1D9', // Lighter Beige for selection
                'wash-stone': '#B8B4AA', // Stone Grey
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['Merriweather', 'serif'],
                mono: ['JetBrains Mono', 'monospace'], // Added for Monospace
            },
            animation: {
                'fade-in': 'fadeIn 0.6s ease-out',
                'slide-up': 'slideUp 0.8s ease-out',
                'ink-spread': 'inkSpread 0.8s ease-out forwards',
                'float': 'float 6s ease-in-out infinite',
                'absorb': 'absorb 0.4s ease-in-out forwards',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                inkSpread: {
                    '0%': { transform: 'scale(0.98) translateY(5px)', opacity: '0' },
                    '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
                },
                absorb: {
                    '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
                    '100%': { opacity: '0', transform: 'translateY(-15px) scale(0.98)', filter: 'blur(2px)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                }
            },
            backgroundImage: {
                'paper-texture': "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.03%22/%3E%3C/svg%3E')",
            }
        }
    },
    plugins: [],
}
