// File guide: This module routes claim list and detail pages for the signed-in user.
// Inputs and outputs: Express requests or configuration enter through its exports; it returns middleware, route responses, query results, or browser behavior as appropriate.
// Connections: Imports and router mounts in app.js show how other modules call this code.

// routers/user-claims-router.js
// Mounted in app.js at /user/claims
const router = require("express").Router();
const authMiddleware = require("../middleware/auth-middleware.js");
const {
  viewClaim,
  listClaims,
} = require("../controllers/user-claims-controller.js");

router.get("/", authMiddleware, listClaims); // /user/claims      (My Claims tab)
router.get("/:id", authMiddleware, viewClaim); // /user/claims/12   (one claim)

module.exports = router;
