// File guide: This module sets security and no-cache response headers.
// Inputs and outputs: Express requests or configuration enter through its exports; it returns middleware, route responses, query results, or browser behavior as appropriate.
// Connections: Imports and router mounts in app.js show how other modules call this code.

// middleware/security.js
// applySecurity(app) -> secure HTTP headers (call it BEFORE session and routes)
// noStore            -> stops browsers/proxies from caching login and register pages
const helmet = require("helmet");

const applySecurity = (app) => {
  app.disable("x-powered-by");
  app.use(
    helmet({
      // Your pages use inline <script> and onclick="" handlers, so a strict CSP would break them.
      // Turn it on later after moving inline scripts to files.
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "same-site" },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    }),
  );
};

const noStore = (req, res, next) => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    Pragma: "no-cache",
    Expires: "0",
  });
  next();
};

module.exports = { applySecurity, noStore };
