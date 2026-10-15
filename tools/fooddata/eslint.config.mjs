// tools/fooddata is a build tool: plain TypeScript, no app or Supabase client imports.
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  { ignores: ["node_modules/*", "dist/*", ".cache/*"] },
  ...tseslint.configs.recommended,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: ["react", "react-*", "@supabase/*", "expo*"], message: "tools/fooddata is plain TypeScript." }] },
      ],
    },
  },
]);
