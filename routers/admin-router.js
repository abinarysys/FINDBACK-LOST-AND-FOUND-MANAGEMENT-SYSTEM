
const router = require('express').Router();

const adminMiddleware = require('../middleware/admin-middleware.js');
const adminController = require('../controllers/admin-controller.js');
const upload = require('../middleware/upload-middleware.js');

// =====================================================
// ADMIN LOGIN & REGISTER PAGES
// Keep these OUTSIDE adminMiddleware
// =====================================================

// Login page
router.get('/login', adminController.getLogin);

// Login form submission
router.post('/login/user', adminController.login);

// Registration page
router.get('/register', adminController.getRegister);

// Registration form submission
// IMPORTANT: Restrict this route to authorized setup/admin use.
router.post(
    '/register/user',
    upload.single('pfp'),
    adminController.register
);

// =====================================================
// PROTECT ALL ROUTES BELOW THIS LINE
// =====================================================
router.use(adminMiddleware);

router.get('/logout', adminController.logout)

// Dashboard
router.get('/', adminController.getDashboard);

// User management
router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);

// Lost and found items
router.get('/lost-items', adminController.getLostItems);
router.get('/found-items', adminController.getFoundItems);

// Claims
router.get('/claims', adminController.getClaims);
router.patch('/claims/:id/status', adminController.updateClaimStatus);

// Feedback
router.get('/feedback', adminController.getFeedback);

module.exports = router;
