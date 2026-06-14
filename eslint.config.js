import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";
import unicorn from "eslint-plugin-unicorn";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js, unicorn },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.node },
    rules: {
      "no-cond-assign": ["error", "always"],
      "eqeqeq": "error",
      "no-unused-vars": "warn",
      "no-undef": "error",
      "unicorn/filename-case": ["error", {
        "case": "camelCase"
      }]
    }
  }
]);