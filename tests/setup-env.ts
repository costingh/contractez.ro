const base = process.env.DATABASE_URL ?? "postgres://prestio:prestio@localhost:5442/prestio";
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? base.replace(/\/[^/]+$/, "/prestio_test");
process.env.REDIS_URL ??= "redis://localhost:6392/1";
process.env.OPENAI_API_KEY = "";
process.env.RESEND_API_KEY = "";
