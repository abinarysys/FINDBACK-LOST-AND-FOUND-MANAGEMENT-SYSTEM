const router = require('express').Router();

const authMiddleware = require('../middleware/auth-middleware.js');
const notificationsController =
    require('../controllers/user-notifications-controller.js');

router.get(
    '/',
    authMiddleware,
    notificationsController.getNotifications
);

module.exports = router;