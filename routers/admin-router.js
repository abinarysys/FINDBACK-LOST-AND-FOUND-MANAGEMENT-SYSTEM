const router = require('express').Router();

const adminMiddleware = require('../middleware/admin-middleware.js');
const adminController = require('../controllers/admin-controller.js');

router.use(adminMiddleware);

// Dashboard
router.get('/', adminController.getDashboard);
router.get('/dashboard', adminController.getDashboard);

// User management
router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);

// Lost and found item lists
router.get('/lost-items', adminController.getLostItems);
router.get('/found-items', adminController.getFoundItems);

// Claims
router.get('/claims', adminController.getClaims);
router.patch('/claims/:id/status', adminController.updateClaimStatus);

// Feedback
router.get('/feedback', adminController.getFeedback);

module.exports = router;
