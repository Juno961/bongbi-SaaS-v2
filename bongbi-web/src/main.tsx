import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initGA4 } from "./lib/analytics";

// Initialize GA4 as early as possible (guarded inside)
try {
  initGA4();
} catch {
  // no-op
}

createRoot(document.getElementById("root")!).render(<App />);
