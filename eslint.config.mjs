import nextConfig from "eslint-config-next";

// Use Next.js recommended ESLint configuration (core-web-vitals by default)
// See: https://nextjs.org/docs/app/api-reference/config/eslint

/** @type {import("eslint").Linter.FlatConfig[]} */
const config = [
  ...nextConfig,
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default config;
