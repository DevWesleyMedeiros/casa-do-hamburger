// frontend/eslint.config.js
// ESLint v9+ "flat config" — espelha o padrão adotado no back-end/eslint.config.js,
// script adaptado para React + TypeScript + Vite (ambiente de browser).

import js from "@eslint/js";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**", "build/**"],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Regras específicas do projeto (arquivos de app, rodando em browser)
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // React Compiler não está ativo neste projeto (sem plugin no vite.config.ts).
      // Esta regra só avisa sobre padrões que impediriam memoização automática no
      // futuro; react-hook-form (watch/useWatch) é biblioteca conhecidamente
      // incompatível por design. Não é bug — reavaliar se/quando o Compiler entrar.
      "react-hooks/incompatible-library": "off",

      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      ...jsxA11y.configs.recommended.rules,

      eqeqeq: ["error", "always"],
      "no-var": "error",
      "prefer-const": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],

      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports" },
      ],
    },
  },

  {
    files: ["vite.config.ts", "eslint.config.js"],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      "no-console": "off",
    },
  },

  {
    files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },
]);
