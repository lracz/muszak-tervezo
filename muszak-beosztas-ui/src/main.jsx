// Alkalmazás belépési pont
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// A fő stílusokat az App.css és Login.css tartalmazza
import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
