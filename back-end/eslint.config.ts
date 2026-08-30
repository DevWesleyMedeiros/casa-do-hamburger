// back-end/eslint.config.js
// ESLint v9+ "flat config" — padrão atual, substitui o antigo .eslintrc.
// Escopo: apenas o backend (Node.js + Express + TypeScript + Bun + Prisma).
// Simula as regras que um time sênior aplicaria em PR review automatizado.

import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import security from 'eslint-plugin-security'
import globals from 'globals'

export default tseslint.config(
  // 1) O que o lint NUNCA deve tocar: gerado por ferramenta, build, deps
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'generated/**', // client customizado do Prisma (src/generated/prisma)
      'prisma/migrations/**',
    ],
  },

  // 2) Regras base de JS recomendadas pelo ESLint
  js.configs.recommended,

  // 3) Regras recomendadas do TypeScript (sem exigir type-checking pesado)
  ...tseslint.configs.recommended,

  // 4) Regras de segurança — relevante porque o Express recebe input
  //    externo direto (body, params, headers) em toda rota
  security.configs.recommended,

  // 5) Configuração específica do projeto
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs', // seu tsconfig.json já está em CommonJS/node resolution
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // --- Correção / bugs comuns ---
      eqeqeq: ['error', 'always'], // proíbe == , exige ===
      'no-var': 'error', // força let/const
      'prefer-const': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }], // console.log solto vira warning

      // --- TypeScript ---
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_', // permite (_req, res) sem reclamar
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn', // any não quebra o build, mas fica visível
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' }, // import type { Foo } from "..." quando for só tipo
      ],
      '@typescript-eslint/no-floating-promises': 'off', // exigiria parserOptions.project (type-aware); ver nota abaixo

      // --- Segurança (Express) ---
      // Ligadas por padrão via security.configs.recommended; ajuste fino:
      'security/detect-object-injection': 'off', // gera muito falso-positivo em Prisma/Express, time madura depois
      'security/detect-non-literal-fs-filename': 'warn',
    },
  },

  // 6) Arquivos de teste: um pouco mais permissivo
  {
    files: ['**/*.test.ts', '**/*.spec.ts', 'src/tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
)
