import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

Sentry.init({
  dsn: "https://dfc3148aa0f743b234a9c9e009b51a95@o4509900352389120.ingest.de.sentry.io/4510991485370448",
  sendDefaultPii: true,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  tracePropagationTargets: ["localhost", /^https:\/\/staging\.unio\.tec\.br\/api/],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  _experiments: {
    enableLogs: true,
  },
});

createRoot(document.getElementById("root")!).render(<App />);
