// File guide: This module makes the current session user available to EJS templates.
// Inputs and outputs: Express requests or configuration enter through its exports; it returns middleware, route responses, query results, or browser behavior as appropriate.
// Connections: Imports and router mounts in app.js show how other modules call this code.

// Makes the current session user available to EJS templates as `user`.
// Guests receive null, so shared navigation can render either account state.
module.exports = (req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
};
