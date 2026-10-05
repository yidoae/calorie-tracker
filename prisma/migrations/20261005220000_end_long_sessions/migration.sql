-- Sessions created before the short-session policy were 30-day cookies: end them all once.
DELETE FROM "Session";
