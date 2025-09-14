import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // Exclude root JavaScript files (utility scripts)
      "*.js",
      "audit-db.js",
      "check-completed-jobs.js", 
      "check-users.js",
      "clean-database.js",
      "fix-urls.js",
    ],
  },
];

export default eslintConfig;
