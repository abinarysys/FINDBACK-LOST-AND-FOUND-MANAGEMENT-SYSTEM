// File guide: This module blocks requests from visitors without a signed-in session.
// Inputs and outputs: Express requests or configuration enter through its exports; it returns middleware, route responses, query results, or browser behavior as appropriate.
// Connections: Imports and router mounts in app.js show how other modules call this code.

// Protects a page or action that requires a signed-in user.
// Input: the Express request/session. Output: continue when signed in, otherwise redirect.
module.exports = (req, res, next) => {
  if (!req.session.user) {
    req.flash("error", "Please login first");
    return res.redirect("/auth/login");
  }

  next();
};
