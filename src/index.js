import React from "react";
import ReactDOM from "react-dom";
import * as Sentry from "@sentry/react";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";

function FallbackComponent() {
  return (
    <div>
      An error has occurred, please message me (@nhanvu327) for
      this.
    </div>
  );
}

Sentry.init({
  dsn:
    "https://1eb6d95377504cdfb3fd3c6629548b7d@o203432.ingest.sentry.io/1318613",
});

ReactDOM.render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={FallbackComponent} showDialog>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
