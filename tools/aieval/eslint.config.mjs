// tools/aieval is an evaluation tool: plain TypeScript, no app framework or Supabase client imports.
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  { ignores: ["node_modules/*", "out/*"] },
  ...tseslint.configs.recommended,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: ["react", "react-*", "@supabase/*", "expo*"], message: "tools/aieval is plain TypeScript." }] },
      ],
    },
  },
]);
