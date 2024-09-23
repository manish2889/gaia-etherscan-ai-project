/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
// import React from 'react';
// import BlockAnalyzer from './BlockAnalyzer';

// function App() {
//   return (
//     <div className="App bg-gray-50 min-h-screen py-8">
//       <BlockAnalyzer />
//     </div>
//   );
// }

// export default App;
