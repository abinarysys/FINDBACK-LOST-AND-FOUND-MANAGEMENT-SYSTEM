// File guide: This module routes the notifications page and JSON read/list endpoints.
// Inputs and outputs: Express requests or configuration enter through its exports; it returns middleware, route responses, query results, or browser behavior as appropriate.
// Connections: Imports and router mounts in app.js show how other modules call this code.

// routers/notification-router.js
// Mounted in app.js at /user/notifications
const router = require("express").Router();
const authMiddleware = require("../middleware/auth-middleware.js");
const controller = require("../controllers/user-notifications-controller.js");

// For fetch() calls: answer 401 JSON instead of redirecting to a login page.
const apiAuth = (req, res, next) => {
  if (req.session?.user?.user_id) return next();
  return res.status(401).json({ success: false, message: "Please log in." });
};

// Page
router.get("/", authMiddleware, controller.getNotifications);

// JSON API (order matters: "read-all" must come before "/:id/read")
router.get("/api/list", apiAuth, controller.listApi);
router.get("/api/unread-count", apiAuth, controller.unreadCountApi);
router.post("/api/read-all", apiAuth, controller.markAllRead);
router.post("/api/:id/read", apiAuth, controller.markOneRead);

module.exports = router;
