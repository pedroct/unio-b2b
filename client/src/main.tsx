import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

Sentry.init({
  dsn: "https://dfc3148aa0f743b234a9c9e009b51a95@o4509900352389120.ingest.de.sentry.io/4510991485370448",
  sendDefaultPii: true,
});

createRoot(document.getElementById("root")!).render(<App />);
