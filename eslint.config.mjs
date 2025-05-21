import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    env: {
      es2022: true,
      node: true,
    },
    extends: [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:require-extensions/recommended",
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    plugins: ["@typescript-eslint", "require-extensions"],
    rules: {},
  },
]);
