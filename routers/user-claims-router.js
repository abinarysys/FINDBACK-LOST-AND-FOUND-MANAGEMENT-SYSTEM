// MODULES AND EXPORTS
const router = require("express").Router();
const authMiddleware = require("../middleware/auth-middleware.js");
const {viewClaim, listClaims,} = require("../controllers/user-claims-controller.js");

// USER CLAIMS (LIST OF CLAIMS)
router.get("/", authMiddleware, listClaims); 

// CHECK ONE CLAIM
router.get("/:id", authMiddleware, viewClaim); 

module.exports = router;
