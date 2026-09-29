import { dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "node:module";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// eslint-plugin-react detects the React version via context.getFilename(),
// which ESLint 10 removed; reading the installed version pins it without
// hard-coding a number that would go stale on the next React upgrade.
const reactVersion = createRequire(import.meta.url)("react/package.json").version;

const eslintConfig = [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/dist/**",
      "**/build/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/*.config.js",
      "**/*.config.mjs",
    ],
  },
  ...compat.extends("next/core-web-vitals"),
  { settings: { react: { version: reactVersion } } },
];

export default eslintConfig;
