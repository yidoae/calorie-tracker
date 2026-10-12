// @calorie/core stays platform-free (constitution I): no React, React Native, Expo or Supabase.
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  { ignores: ["node_modules/*"] },
  ...tseslint.configs.recommended,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: ["react", "react-*", "@supabase/*", "expo*"], message: "@calorie/core is pure TypeScript." }] },
      ],
    },
  },
]);
