// src/main.jsx
// Routes between the admin platform and the member portal
// based on the URL path.
//
//   http://localhost:3000/         → Admin platform (ShepherdOS)
//   http://localhost:3000/portal   → Member Portal

import React from "react";
import ReactDOM from "react-dom/client";

const path = window.location.pathname;

async function boot() {
  let App;
  if (path.startsWith("/portal")) {
    const mod = await import("./MemberPortalApp.jsx");
    App = mod.default;
  } else {
    const mod = await import("./App.jsx");
    App = mod.default;
  }

  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

boot();
