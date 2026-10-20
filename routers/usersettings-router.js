// routers/usersettings-router.js
// Mounted in app.js at /user/settings
const router = require('express').Router();
const query = require('../config/query.js');
const authMiddleware = require('../middleware/auth-middleware.js');
const { ACCENTS, DEFAULT_THEME, isMode, isAccent, sanitize } = require('../config/theme.js');

// For fetch() calls: answer 401 JSON instead of redirecting to the login page.
const apiAuth = (req, res, next) =>
    req.session?.user?.user_id
        ? next()
        : res.status(401).json({ success: false, message: 'Please log in.' });

// Settings page
router.get('/', authMiddleware, (req, res) => {
    res.render('user/settings', {
        user: req.session.user,
        accents: ACCENTS,
        theme: req.session.user.theme || DEFAULT_THEME
    });
});

// Save appearance. The user id ALWAYS comes from the session, never from the request body.
router.post('/theme', apiAuth, async (req, res) => {
    const { mode, color } = req.body || {};

    if (!isMode(mode) || !isAccent(color)) {
        return res.status(400).json({ success: false, message: 'Invalid theme.' });
    }

    const theme = sanitize({ mode, color });

    try {
        await query(
            'UPDATE users SET theme_mode = ?, theme_color = ? WHERE user_id = ?',
            [theme.mode, theme.color, req.session.user.user_id]
        );
        req.session.user.theme = theme;     // next page load already uses it
        res.json({ success: true, theme });
    } catch (error) {
        console.error('Error saving theme:', error);
        res.status(500).json({ success: false, message: 'Unable to save your appearance settings.' });
    }
});

module.exports = router;
