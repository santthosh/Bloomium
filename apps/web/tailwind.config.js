/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Bloomium Brand Colors
        'petal-pink': {
          DEFAULT: '#E573A7',
          50: '#FCF3F8',
          100: '#F9E7F0',
          200: '#F3CFE1',
          300: '#EDB7D2',
          400: '#E99FC3',
          500: '#E573A7', // Main
          600: '#DF4589',
          700: '#C8316E',
          800: '#9A2656',
          900: '#6C1B3D',
        },
        'leaf-green': {
          DEFAULT: '#4CAF50',
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#4CAF50', // Main
          600: '#43A047',
          700: '#388E3C',
          800: '#2E7D32',
          900: '#1B5E20',
        },
        'sky-blue': {
          DEFAULT: '#42A5F5',
          50: '#E3F2FD',
          100: '#BBDEFB',
          200: '#90CAF9',
          300: '#64B5F6',
          400: '#42A5F5', // Main
          500: '#2196F3',
          600: '#1E88E5',
          700: '#1976D2',
          800: '#1565C0',
          900: '#0D47A1',
        },
        'space-navy': {
          DEFAULT: '#1A237E',
          50: '#E8EAF6',
          100: '#C5CAE9',
          200: '#9FA8DA',
          300: '#7986CB',
          400: '#5C6BC0',
          500: '#3F51B5',
          600: '#3949AB',
          700: '#303F9F',
          800: '#283593',
          900: '#1A237E', // Main
        },
      },
    },
  },
  plugins: [],
};

