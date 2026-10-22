// File guide: This module connects auth URLs to the secure authentication controller and protections.
// Inputs and outputs: Express requests or configuration enter through its exports; it returns middleware, route responses, query results, or browser behavior as appropriate.
// Connections: Imports and router mounts in app.js show how other modules call this code.

// routes/auth.js   (mounted at /auth)
// Replaces the old /auth/loginUser and /auth/registerUser routes.
// If your current auth router has other routes (forgot password, etc.), copy them in below.
const router = require("express").Router();
const auth = require("../controllers/secure-auth");
const { ensureCsrf, verifyCsrf } = require("../middleware/csrf");
const { noStore } = require("../middleware/security");
const {
  uploadPfp,
  verifyImage,
} = require("../middleware/upload-middleware.js");

router.use(noStore, ensureCsrf);

router.get("/login", auth.getLogin);
router.post("/login", auth.loginLimiter, verifyCsrf, auth.login);

router.get("/register", auth.getRegister);
// limiter first (so flooders can't upload), multer parses the form, then CSRF, then the image check
router.post(
  "/register",
  auth.registerLimiter,
  uploadPfp,
  verifyCsrf,
  verifyImage,
  auth.register,
);

router.get("/logout", auth.logout);

module.exports = router;
