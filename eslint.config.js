import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  {
    ignores: ["dist"],
  },
  ...compat.config({
    extends: ["next/core-web-vitals"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  }),
];
