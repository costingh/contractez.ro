const base = process.env.DATABASE_URL ?? "postgres://prestio:prestio@localhost:5442/prestio";
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? base.replace(/\/[^/]+$/, "/prestio_test");
process.env.REDIS_URL ??= "redis://localhost:6392/1";
process.env.OPENAI_API_KEY = "";
process.env.RESEND_API_KEY = "";
// Testele nu folosesc niciodată contul Stripe din .env (cheile și prețurile reale din sandbox/live).
process.env.STRIPE_SECRET_KEY = "";
process.env.STRIPE_WEBHOOK_SECRET = "";
process.env.STRIPE_PRICE_PRO = "";
process.env.STRIPE_PRICE_BUSINESS = "";
process.env.PAYMENTS_ENABLED = "";
