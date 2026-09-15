import { brandGreen, brandYellow, brandNeutral } from './src/brandColors.js';

/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                brand: brandGreen, sunshine: brandYellow,
                // All existing CRM surfaces use the same logo-derived palette,
                // including dynamically selected stage/status utility classes.
                primary: brandGreen, green: brandGreen, emerald: brandGreen,
                teal: brandGreen, cyan: brandGreen, sky: brandGreen, blue: brandGreen,
                indigo: brandGreen, violet: brandGreen, purple: brandGreen,
                pink: brandGreen, fuchsia: brandGreen,
                accent: brandYellow, amber: brandYellow, yellow: brandYellow,
                orange: brandYellow, lime: brandYellow,
                stone: brandNeutral, gray: brandNeutral, slate: brandNeutral,
                zinc: brandNeutral, neutral: brandNeutral,
            },
            fontFamily: {
                heading: ['Google Sans Flex', 'system-ui', 'sans-serif'],
                sans: ['Nunito Sans', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
