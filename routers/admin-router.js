// MOUNT ROUTER MODULE
const router = require("express").Router();

// EXPORTS
const claimsController = require("../controllers/admin-claims-controller.js");
const adminMiddleware = require("../middleware/admin-middleware.js");
const adminController = require("../controllers/admin-controller.js");
const upload = require("../middleware/upload-middleware.js");

// UPLOAD PHOTO ERROR
const uploadPfp = (redirectTo) => (req, res, next) =>
  upload.single("pfp")(req, res, (err) => {
    if (err) {
      req.flash("error", err.message || "Could not upload that image.");
      return res.redirect(redirectTo);
    }
    next();
  });

// CHECK FOR THE ADMIN UI 
router.use(adminMiddleware.locals);

// PUBLIC ADMIN PAGES (USERS DON'T KNOW THEY CAN ALSO LOGIN AS ADMIN VIA auth/login)
router.get("/login", adminController.getLogin);
router.post("/login/user", adminController.login);

// Admin accounts can only be created by a signed-in administrator in Settings.
// Keep legacy setup URLs closed so they cannot be used as a public bootstrap path.
router.all("/register", (req, res) => res.sendStatus(404));
router.all("/register/user", (req, res) => res.sendStatus(404));


router.use(adminMiddleware);

// ADMIN CLAIMS
router.get("/claims", claimsController.getClaims);
router.patch("/claims/:id/status", claimsController.updateClaimStatus);

router.get("/logout", adminController.logout);

// ADMIN DASHBOARD
router.get("/", adminController.getDashboard);

// MANAGE USERS
router.get("/users", adminController.getUsers);
router.patch("/users/:id/status", adminController.updateUserStatus);

// MANAGE LOST AND FOUBND ITEMS
router.get("/lost-items", adminController.getLostItems);
router.get("/found-items", adminController.getFoundItems);

// ADMI VERIFICATION
router.get("/user-verification", adminController.getUserVerification);
router.patch(
  "/users/:id/verification",
  adminController.updateVerificationStatus,
);

// ADMIN ANALYTICS, REPORTS, ACRTIVITY LOGS
router.get("/analytics", adminController.getAnalytics);
router.get("/reports", adminController.getReports);
router.get("/activity-logs", adminController.getActivityLogs);

// ADMIN SETTINGS
router.get("/settings", adminController.getSettings);
router.post("/settings/admins", adminController.addAdmin);
router.patch("/settings/admins/:id/status", adminController.updateAdminStatus);

// ADMIN PROFILE
router.get("/profile", adminController.getProfile);
router.post(
  "/profile",
  uploadPfp("/admin/profile"),
  adminController.updateProfile,
);
router.post("/profile/password", adminController.changePassword);

// UNKNOWN ADMIN/ URL
router.use(adminController.notFound);

module.exports = router;
