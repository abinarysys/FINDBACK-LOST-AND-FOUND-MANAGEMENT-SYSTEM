// File guide: This module loads a saved theme into the session and view locals.
// Inputs and outputs: Express requests or configuration enter through its exports; it returns middleware, route responses, query results, or browser behavior as appropriate.
// Connections: Imports and router mounts in app.js show how other modules call this code.

// middleware/user-theme.js
// Loads the logged-in user's saved theme from MySQL ONCE per login and keeps it in their session.
// Each user only ever reads their own row (user_id comes from the session).
const query = require("../config/query");
const { DEFAULT_THEME, sanitize } = require("../config/theme");

let warned = false;

module.exports = async (req, res, next) => {
  const user = req.session?.user;
  if (!user) return next();

  if (!user.theme) {
    try {
      const rows = await query(
        "SELECT theme_mode, theme_color FROM users WHERE user_id = ?",
        [user.user_id],
      );
      user.theme = rows.length
        ? sanitize({ mode: rows[0].theme_mode, color: rows[0].theme_color })
        : { ...DEFAULT_THEME };
    } catch (error) {
      // Most likely sql/user-theme.sql has not been run yet. Use defaults instead of crashing.
      if (!warned) {
        console.warn(
          "Theme columns not available (run sql/user-theme.sql):",
          error.message,
        );
        warned = true;
      }
      user.theme = { ...DEFAULT_THEME };
    }
  }

  res.locals.theme = user.theme;
  next();
};
