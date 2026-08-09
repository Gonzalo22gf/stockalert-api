import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://cb7ec8148fc0fc25cc68d6a7f8243000@o4511878424952832.ingest.us.sentry.io/4511878440615936",
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.2
});

import React from "react";
import "./lib/i18n/index.js";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";
import "sweetalert2/dist/sweetalert2.min.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60
    }
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
