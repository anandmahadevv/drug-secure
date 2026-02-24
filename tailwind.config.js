/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                ayurveda: {
                    green: '#2d4a22',
                    light: '#f5f1e6',
                    beige: '#d2c2a4',
                    accent: '#4a6741',
                },
                tech: {
                    blue: '#1a2a6c',
                    navy: '#0f172a',
                    cyan: '#0ea5e9',
                }
            },
            fontFamily: {
                serif: ['"Playfair Display"', 'serif'],
                sans: ['"Inter"', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
