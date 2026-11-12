// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'supabase/functions/**'],
  },
  {
    // The OpenAI key must never ship in the app. All LLM calls go through Supabase edge functions.
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'openai',
              message: 'LLM calls are server-only. Call a Supabase edge function instead (see AGENTS.md).',
            },
          ],
          patterns: [
            {
              group: ['openai/*'],
              message: 'LLM calls are server-only. Call a Supabase edge function instead (see AGENTS.md).',
            },
          ],
        },
      ],
    },
  },
  {
    // shared/ must stay runtime-agnostic so Deno edge functions can import it.
    files: ['shared/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-native', 'react-native/*', 'expo', 'expo-*', '@/*', 'node:*'],
              message: 'shared/ may only import zod and other shared/ files (see shared/README.md).',
            },
          ],
        },
      ],
    },
  },
]);
