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
