import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@glideapps/glide-data-grid/dist/index.css";

import { App } from "./example/App";
import "./example/example.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
