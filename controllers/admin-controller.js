const db = require('../config/db.js');

// Helper for database queries
const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
};

// Dashboard statistics
exports.getDashboard = async (req, res) => {
    try {
        const [users, lostItems, foundItems, claims, feedback] =
            await Promise.all([
                query('SELECT COUNT(*) AS total FROM users'),
                query('SELECT COUNT(*) AS total FROM lost_items'),
                query('SELECT COUNT(*) AS total FROM found_items'),
                query(
                    "SELECT COUNT(*) AS total FROM claims WHERE status = 'pending'"
                ),
                query('SELECT COUNT(*) AS total FROM feedback')
            ]);

        res.json({
            success: true,
            statistics: {
                totalUsers: users[0].total,
                totalLostItems: lostItems[0].total,
                totalFoundItems: foundItems[0].total,
                pendingClaims: claims[0].total,
                totalFeedback: feedback[0].total
            }
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).json({
            success: false,
            message: 'Could not load dashboard statistics.'
        });
    }
};

// Get users without exposing password hashes
exports.getUsers = async (req, res) => {
    try {
        const users = await query(`
            SELECT user_id, full_name, email, role,
                   account_status, profile_image, created_at,
                   contact_number
            FROM users
            ORDER BY created_at DESC
        `);

        res.json({ success: true, users });
    } catch (err) {
        console.error('Get users error:', err);
        res.status(500).json({
            success: false,
            message: 'Could not retrieve users.'
        });
    }
};

// Update user account status
exports.updateUserStatus = async (req, res) => {
    const { status } = req.body;
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId < 1) {
        return res.status(400).json({
            success: false,
            message: 'Invalid user ID.'
        });
    }

    if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Status must be active or inactive.'
        });
    }

    // Prevent an admin from disabling their own account
    if (userId === Number(req.session.user.user_id)) {
        return res.status(400).json({
            success: false,
            message: 'You cannot change your own account status here.'
        });
    }

    try {
        const result = await query(
            'UPDATE users SET account_status = ? WHERE user_id = ?',
            [status, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        res.json({
            success: true,
            message: 'User account status updated.'
        });
    } catch (err) {
        console.error('Update user status error:', err);
        res.status(500).json({
            success: false,
            message: 'Could not update user status.'
        });
    }
};

// Get lost items
exports.getLostItems = async (req, res) => {
    try {
        const items = await query(`
            SELECT li.*, u.full_name, c.category_name
            FROM lost_items li
            LEFT JOIN users u ON li.user_id = u.user_id
            LEFT JOIN item_categories c ON li.category_id = c.category_id
            ORDER BY li.created_at DESC
        `);

        res.json({ success: true, items });
    } catch (err) {
        console.error('Get lost items error:', err);
        res.status(500).json({
            success: false,
            message: 'Could not retrieve lost items.'
        });
    }
};

// Get found items
exports.getFoundItems = async (req, res) => {
    try {
        const items = await query(`
            SELECT fi.*, u.full_name, c.category_name
            FROM found_items fi
            LEFT JOIN users u ON fi.user_id = u.user_id
            LEFT JOIN item_categories c ON fi.category_id = c.category_id
            ORDER BY fi.created_at DESC
        `);

        res.json({ success: true, items });
    } catch (err) {
        console.error('Get found items error:', err);
        res.status(500).json({
            success: false,
            message: 'Could not retrieve found items.'
        });
    }
};

// Get claims
exports.getClaims = async (req, res) => {
    try {
        const claims = await query(`
            SELECT cl.*, u.full_name, u.email,
                   fi.item_name, fi.photo_path
            FROM claims cl
            LEFT JOIN users u ON cl.user_id = u.user_id
            LEFT JOIN found_items fi
                ON cl.found_item_id = fi.found_item_id
            ORDER BY cl.created_at DESC
        `);

        res.json({ success: true, claims });
    } catch (err) {
        console.error('Get claims error:', err);
        res.status(500).json({
            success: false,
            message: 'Could not retrieve claims.'
        });
    }
};

// Update claim status
exports.updateClaimStatus = async (req, res) => {
    const { status } = req.body;
    const claimId = Number(req.params.id);

    if (!Number.isInteger(claimId) || claimId < 1) {
        return res.status(400).json({
            success: false,
            message: 'Invalid claim ID.'
        });
    }

    if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid claim status.'
        });
    }

    try {
        const result = await query(
            'UPDATE claims SET status = ? WHERE claim_id = ?',
            [status, claimId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Claim not found.'
            });
        }

        res.json({
            success: true,
            message: 'Claim status updated.'
        });
    } catch (err) {
        console.error('Update claim status error:', err);
        res.status(500).json({
            success: false,
            message: 'Could not update claim status.'
        });
    }
};

// Get feedback
exports.getFeedback = async (req, res) => {
    try {
        const feedback = await query(`
            SELECT f.feedback_id, f.rating, f.message,
                   f.created_at, u.full_name, u.email
            FROM feedback f
            LEFT JOIN users u ON f.user_id = u.user_id
            ORDER BY f.created_at DESC
        `);

        res.json({ success: true, feedback });
    } catch (err) {
        console.error('Get feedback error:', err);
        res.status(500).json({
            success: false,
            message: 'Could not retrieve feedback.'
        });
    }
};
