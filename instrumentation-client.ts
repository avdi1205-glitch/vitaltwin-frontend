// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://06d73b0300ab40179b230c5435be0f6f@o4511848022474752.ingest.de.sentry.io/4511848135655504",

  // Add optional integrations for additional features
  integrations: [Sentry.replayIntegration()],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // VitalTwin handles sensitive health data (CGM, nutrition, Twin chat) — disable
  // every automatic data-collection category so nothing beyond the error/trace
  // itself ever reaches Sentry. See frontend/docs/GOOGLE_HEALTH_API_AUDIT.md's
  // "no health data in error tracking" requirement, applied app-wide here.
  dataCollection: {
    userInfo: false,
    httpBodies: [],
    cookies: false,
    httpHeaders: { request: false, response: false },
    urlQueryParams: false,
    genAI: { inputs: false, outputs: false },
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
