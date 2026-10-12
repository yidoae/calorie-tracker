// Layer rules from the constitution (I): app → components → hooks/providers → services → @calorie/core.
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

const restrict = (patterns) => ({ "no-restricted-imports": ["error", { patterns }] });
const supabaseOnlyInServices = { group: ["@supabase/*"], message: "Only src/services/ talks to Supabase." };

module.exports = defineConfig([
  expoConfig,
  { ignores: ["dist/*", ".expo/*"] },
  { files: ["src/**/*.{ts,tsx}"], ignores: ["src/services/**"], rules: restrict([supabaseOnlyInServices]) },
  {
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: restrict([
      supabaseOnlyInServices,
      { group: ["@/hooks/*", "@/providers/*", "@/services/*"], message: "UI components only take props." },
    ]),
  },
  {
    files: ["src/components/**/*.{ts,tsx}"],
    ignores: ["src/components/ui/**"],
    rules: restrict([supabaseOnlyInServices, { group: ["@/services/*"], message: "Components reach data through hooks." }]),
  },
  {
    files: ["src/services/**/*.{ts,tsx}"],
    rules: restrict([{ group: ["@/components/*", "@/hooks/*", "@/providers/*", "@/app/*"], message: "Services sit below the UI." }]),
  },
]);
