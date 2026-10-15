
module.exports = (req, res, next) => {
    // Check if the user is logged in
    if (!req.session || !req.session.user) {
        // API requests receive JSON
        if (req.originalUrl.startsWith('/api/')) {
            return res.status(401).json({
                success: false,
                message: 'Please log in first.'
            });
        }

        // Page requests redirect to login
        req.flash('error', 'Please login first.');
        return res.redirect('/admin/login');
    }

    // Check if the logged-in user is an admin
    if (req.session.user.role !== 'admin') {
        if (req.originalUrl.startsWith('/api/')) {
            return res.status(403).json({
                success: false,
                message: 'Admin access only.'
            });
        }

        return res.status(403).send('403 - Admin access only.');
    }

    // Admin is authenticated
    next();
};
