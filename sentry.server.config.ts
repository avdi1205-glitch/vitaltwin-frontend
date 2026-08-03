// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://06d73b0300ab40179b230c5435be0f6f@o4511848022474752.ingest.de.sentry.io/4511848135655504",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // VitalTwin handles sensitive health data (CGM, nutrition, Twin chat) — disable
  // every automatic data-collection category so request bodies/cookies/headers
  // (which can contain health data or session tokens) never reach Sentry.
  dataCollection: {
    userInfo: false,
    httpBodies: [],
    cookies: false,
    httpHeaders: { request: false, response: false },
    urlQueryParams: false,
    genAI: { inputs: false, outputs: false },
  },
});
