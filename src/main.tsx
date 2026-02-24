import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

const base = window['__BASE_URL__'] ?? "/";

// Remove trailing slash – React Router does NOT want it
const basename = base !== "/" ? base.replace(/\/$/, "") : "/";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter basename={basename}>
    <App />
  </BrowserRouter>
);
