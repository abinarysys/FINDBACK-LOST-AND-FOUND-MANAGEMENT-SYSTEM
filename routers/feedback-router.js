// File guide: This module saves feedback submitted by signed-in users.
// Inputs and outputs: Express requests or configuration enter through its exports; it returns middleware, route responses, query results, or browser behavior as appropriate.
// Connections: Imports and router mounts in app.js show how other modules call this code.

// MODULES
const router = require("express").Router();
const db = require("../config/db.js");

// MIDDLEWARE
const authMiddleware = require("../middleware/auth-middleware.js");

// FOR THE FORM
// THIS CREATES A FEEDBACK IN THE HOME PAGE
//index.ejs
router.post("/feedback", authMiddleware, (req, res) => {
  const { rate, msg } = req.body;

  // IF NOT USER, LOG IN
  if (!req.session.user) {
    req.flash("error", "Please log in to submit feedback.");
    return res.redirect("/auth/login");
  }

  // USER'S ID
  const userId = req.session.user.user_id;

  // INSERT THE FEEDBACK IN THE feedback's TABLE
  const giveFeedback = `INSERT INTO feedback (user_id, rating, message) VALUES (?, ?, ?)`;
  db.query(giveFeedback, [userId, rate, msg], (err) => {
    if (err) {
      console.log("Feedback error:", err);
      req.flash("error", "Feedback failed");
      return res.redirect("/");
    }
    req.flash("success", "Feedback Succeeded");
    return res.redirect("/");
  });
});

// EXPORT ROUTER GLOBALLY
module.exports = router;
