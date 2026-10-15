const crypto = require('crypto');
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

// =====================================================
// ADMIN REGISTER
// =====================================================
exports.register = async (req, res) => {
    try {
        const { name, email, pw, num } = req.body;

        if (!name || !email || !pw || !num) {
            req.flash('error', 'Please complete all required fields.');
            return res.redirect('/admin/register');
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (pw.length < 8) {
            req.flash('error', 'Password must be at least 8 characters.');
            return res.redirect('/admin/register');
        }

        // Check if email already exists
        const existingUser = await query(
            'SELECT user_id FROM users WHERE email = ?',
            [normalizedEmail]
        );

        if (existingUser.length > 0) {
            req.flash('error', 'Email is already registered.');
            return res.redirect('/admin/register');
        }

        // Compatible with the existing user login password format
        const password = crypto
            .createHash('sha256')
            .update(pw)
            .digest('hex');

        const profileImage = req.file
            ? '/uploads/' + req.file.filename
            : null;

        await query(
            `INSERT INTO users (
                full_name,
                email,
                password_hash,
                profile_image,
                contact_number,
                role,
                account_status
            ) VALUES (?, ?, ?, ?, ?, 'admin', 'active')`,
            [
                name.trim(),
                normalizedEmail,
                password,
                profileImage,
                num.trim()
            ]
        );

        req.flash('success', 'Admin account created successfully!');
        return res.redirect('/auth/login');

    } catch (err) {
        console.error('Admin registration error:', err);

        if (err.code === 'ER_DUP_ENTRY') {
            req.flash('error', 'Email is already registered.');
            return res.redirect('/admin/register');
        }

        req.flash('error', 'Registration failed. Please try again.');
        return res.redirect('/admin/register');
    }
};

// =====================================================
// ADMIN LOGIN
// =====================================================

exports.login = async (req, res) => {
    try {
        const { email, pw } = req.body;

        // Validate inputs
        if (!email || !pw) {
            req.flash('error', 'Please enter your email and password.');
            return res.redirect('/admin/login');
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Find account
        const users = await query(
            `SELECT
                user_id,
                full_name,
                email,
                password_hash,
                profile_image,
                contact_number,
                role,
                account_status
             FROM users
             WHERE email = ?`,
            [normalizedEmail]
        );

        if (users.length === 0) {
            req.flash('error', 'Invalid email or password.');
            return res.redirect('/admin/login');
        }

        const user = users[0];

        // Allow administrators only
        if (user.role !== 'admin') {
            req.flash('error', 'Invalid email or password.');
            return res.redirect('/admin/login');
        }

        // Verify password using your existing SHA-256 format
        const hashedPassword = crypto
            .createHash('sha256')
            .update(pw)
            .digest('hex');

        if (user.password_hash !== hashedPassword) {
            req.flash('error', 'Invalid email or password.');
            return res.redirect('/admin/login');
        }

        // Check account status
        if (user.account_status !== 'active') {
            req.flash('error', 'Your admin account is inactive.');
            return res.redirect('/admin/login');
        }

        // Create a fresh session
        req.session.regenerate((err) => {
            if (err) {
                console.error('Admin session regeneration error:', err);
                return res.status(500).send(
                    'Could not create a secure login session.'
                );
            }

            req.session.user = {
                user_id: user.user_id,
                username: user.full_name,
                full_name: user.full_name,
                email: user.email,
                profile_image: user.profile_image,
                num: user.contact_number,
                role: 'admin'
            };

            req.session.save((saveErr) => {
                if (saveErr) {
                    console.error('Admin session save error:', saveErr);
                    return res.status(500).send(
                        'Could not save login session.'
                    );
                }

                req.flash(
                    'success',
                    `Welcome, ${user.full_name}!`
                );

                return res.redirect('/admin');
            });
        });

    } catch (err) {
        console.error('Admin login error:', err);
        req.flash('error', 'Login failed. Please try again.');
        return res.redirect('/admin/login');
    }
};


 // =====================================================
// GET ADMIN REGISTER PAGE
// =====================================================
exports.getRegister = (req, res) => {
    res.render('admin/adminRegister', {
        success: req.flash('success'),
        error: req.flash('error')
    });
};

// =====================================================
// GET ADMIN LOGIN PAGE
// =====================================================
exports.getLogin = (req, res) => {
    res.render('admin/adminLogin', {
        success: req.flash('success'),
        error: req.flash('error')
    });
};


 // =====================================================
// ADMIN LOGOUT
// =====================================================
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Admin logout failed:', err);

            return res.status(500).send(
                'Could not log out. Please try again.'
            );
        }

        res.clearCookie('connect.sid');
        return res.redirect('/admin/login');
    });
};


// =====================================================
// DASHBOARD STATISTICS
// =====================================================
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

        res.render('admin/adminDashboard', {
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

// =====================================================
// GET USERS
// =====================================================
exports.getUsers = async (req, res) => {
    try {
        const users = await query(`
            SELECT
                user_id,
                full_name,
                email,
                role,
                account_status,
                profile_image,
                created_at,
                contact_number
            FROM users
            ORDER BY created_at DESC
        `);

        res.json({
            success: true,
            users
        });

    } catch (err) {
        console.error('Get users error:', err);

        res.status(500).json({
            success: false,
            message: 'Could not retrieve users.'
        });
    }
};

// =====================================================
// UPDATE USER ACCOUNT STATUS
// =====================================================
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
    if (
        !req.session.user ||
        userId === Number(req.session.user.user_id)
    ) {
        if (
            req.session.user &&
            userId === Number(req.session.user.user_id)
        ) {
            return res.status(400).json({
                success: false,
                message: 'You cannot change your own account status here.'
            });
        }
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

// =====================================================
// GET LOST ITEMS
// =====================================================
exports.getLostItems = async (req, res) => {
    try {
        const items = await query(`
            SELECT
                li.*,
                u.full_name,
                c.category_name
            FROM lost_items li
            LEFT JOIN users u
                ON li.user_id = u.user_id
            LEFT JOIN item_categories c
                ON li.category_id = c.category_id
            ORDER BY li.created_at DESC
        `);

        res.json({
            success: true,
            items
        });

    } catch (err) {
        console.error('Get lost items error:', err);

        res.status(500).json({
            success: false,
            message: 'Could not retrieve lost items.'
        });
    }
};

// =====================================================
// GET FOUND ITEMS
// =====================================================
exports.getFoundItems = async (req, res) => {
    try {
        const items = await query(`
            SELECT
                fi.*,
                u.full_name,
                c.category_name
            FROM found_items fi
            LEFT JOIN users u
                ON fi.user_id = u.user_id
            LEFT JOIN item_categories c
                ON fi.category_id = c.category_id
            ORDER BY fi.created_at DESC
        `);

        res.json({
            success: true,
            items
        });

    } catch (err) {
        console.error('Get found items error:', err);

        res.status(500).json({
            success: false,
            message: 'Could not retrieve found items.'
        });
    }
};

// =====================================================
// GET CLAIMS
// =====================================================
exports.getClaims = async (req, res) => {
    try {
        const claims = await query(`
            SELECT
                cl.*,
                u.full_name,
                u.email,
                fi.item_name,
                fi.photo_path
            FROM claims cl
            LEFT JOIN users u
                ON cl.user_id = u.user_id
            LEFT JOIN found_items fi
                ON cl.found_item_id = fi.found_item_id
            ORDER BY cl.created_at DESC
        `);

        res.json({
            success: true,
            claims
        });

    } catch (err) {
        console.error('Get claims error:', err);

        res.status(500).json({
            success: false,
            message: 'Could not retrieve claims.'
        });
    }
};

// =====================================================
// UPDATE CLAIM STATUS
// =====================================================
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

// =====================================================
// GET FEEDBACK
// =====================================================
exports.getFeedback = async (req, res) => {
    try {
        const feedback = await query(`
            SELECT
                f.feedback_id,
                f.rating,
                f.message,
                f.created_at,
                u.full_name,
                u.email
            FROM feedback f
            LEFT JOIN users u
                ON f.user_id = u.user_id
            ORDER BY f.created_at DESC
        `);

        res.json({
            success: true,
            feedback
        });

    } catch (err) {
        console.error('Get feedback error:', err);

        res.status(500).json({
            success: false,
            message: 'Could not retrieve feedback.'
        });
    }
};
