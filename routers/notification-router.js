// MODULES AND EXPORTS
const router = require("express").Router();
const authMiddleware = require("../middleware/auth-middleware.js");
const controller = require("../controllers/user-notifications-controller.js");

const apiAuth = (req, res, next) => {
  if (req.session?.user?.user_id) return next();
  return res.status(401).json({ success: false, message: "Please log in." });
};

// LANDING PAGE, THE NOTIFICATION POP UP
router.get("/", authMiddleware, controller.getNotifications);

//  API
router.get("/api/list", apiAuth, controller.listApi);
router.get("/api/unread-count", apiAuth, controller.unreadCountApi);
router.post("/api/read-all", apiAuth, controller.markAllRead);
router.post("/api/:id/read", apiAuth, controller.markOneRead);

module.exports = router;
