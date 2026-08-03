// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://06d73b0300ab40179b230c5435be0f6f@o4511848022474752.ingest.de.sentry.io/4511848135655504",

  // See instrumentation-client.ts for why this was lowered from the wizard's
  // 100% default — real measured overhead, documented in PERFORMANCE_AUDIT.md.
  tracesSampleRate: 0.2,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Same privacy hardening as sentry.server.config.ts / instrumentation-client.ts.
  dataCollection: {
    userInfo: false,
    httpBodies: [],
    cookies: false,
    httpHeaders: { request: false, response: false },
    urlQueryParams: false,
    genAI: { inputs: false, outputs: false },
  },
});
