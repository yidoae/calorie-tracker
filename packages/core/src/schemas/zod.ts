import { z } from "zod";

// Default validation messages in Turkish, so any schema error can be shown to the user as-is.
// Every schema file imports `z` from here (not from "zod") so this runs first, on server and client.
z.config(z.locales.tr());

export { z };
