
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

        const existingUser = await query(
            'SELECT user_id FROM users WHERE email = ?',
            [normalizedEmail]
        );

        if (existingUser.length > 0) {
            req.flash('error', 'Email is already registered.');
            return res.redirect('/admin/register');
        }

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

        if (!email || !pw) {
            req.flash('error', 'Please enter your email and password.');
            return res.redirect('/admin/login');
        }

        const normalizedEmail = email.trim().toLowerCase();

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

        if (user.role !== 'admin') {
            req.flash('error', 'Invalid email or password.');
            return res.redirect('/admin/login');
        }

        const hashedPassword = crypto
            .createHash('sha256')
            .update(pw)
            .digest('hex');

        if (user.password_hash !== hashedPassword) {
            req.flash('error', 'Invalid email or password.');
            return res.redirect('/admin/login');
        }

        if (user.account_status !== 'active') {
            req.flash('error', 'Your admin account is inactive.');
            return res.redirect('/admin/login');
        }

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

                req.flash('success', `Welcome, ${user.full_name}!`);
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
            },
            activePage: 'dashboard'
        });

    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).send(
            'Could not load dashboard statistics.'
        );
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

        res.render('admin/admin-users', {
            users,
            activePage: 'users'
        });

    } catch (err) {
        console.error('Get users error:', err);
        res.status(500).send('Could not retrieve users.');
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

    if (
        req.session.user &&
        userId === Number(req.session.user.user_id)
    ) {
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

        return res.json({
            success: true,
            message: 'User account status updated.'
        });

    } catch (err) {
        console.error('Update user status error:', err);

        return res.status(500).json({
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

        res.render('admin/admin-lost-items', {
            items,
            activePage: 'items',
            itemType: 'lost'
        });

    } catch (err) {
        console.error('Get lost items error:', err);
        res.status(500).send('Could not retrieve lost items.');
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

        res.render('admin/admin-found-items', {
            items,
            activePage: 'items',
            itemType: 'found'
        });

    } catch (err) {
        console.error('Get found items error:', err);
        res.status(500).send('Could not retrieve found items.');
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

        res.render('admin/admin-claims', {
            claims,
            activePage: 'claims'
        });

    } catch (err) {
        console.error('Get claims error:', err);
        res.status(500).send('Could not retrieve claims.');
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

        return res.json({
            success: true,
            message: 'Claim status updated.'
        });

    } catch (err) {
        console.error('Update claim status error:', err);

        return res.status(500).json({
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

        res.render('admin/admin-feedback', {
            feedback,
            activePage: 'feedback'
        });

    } catch (err) {
        console.error('Get feedback error:', err);
        res.status(500).send('Could not retrieve feedback.');
    }
};

/* =====================================================
   USER VERIFICATION
===================================================== */

// Display users awaiting verification
exports.getUserVerification = async (req, res) => {
    try {
        const users = await query(`
            SELECT
                user_id,
                full_name,
                email,
                contact_number,
                profile_image,
                created_at,
                verification_status,
                account_status
            FROM users
            WHERE role = 'user'
            ORDER BY
                CASE
                    WHEN verification_status = 'pending' THEN 0
                    ELSE 1
                END,
                created_at DESC
        `);

        res.render('admin/admin-user-verification', {
            users,
            activePage: 'verification'
        });
    } catch (err) {
        console.error('User verification error:', err);
        res.status(500).send('Could not load user verification.');
    }
};

// Approve or reject a user
exports.updateVerificationStatus = async (req, res) => {
    const userId = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(userId) || userId < 1) {
        return res.status(400).json({
            success: false,
            message: 'Invalid user ID.'
        });
    }

    if (!['verified', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid verification status.'
        });
    }

    try {
        const result = await query(
            `UPDATE users
             SET verification_status = ?
             WHERE user_id = ? AND role = 'user'`,
            [status, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        return res.json({
            success: true,
            message: `User ${status} successfully.`
        });
    } catch (err) {
        console.error('Update verification error:', err);
        return res.status(500).json({
            success: false,
            message: 'Could not update verification status.'
        });
    }
};


 // =====================================================
 // ANALYTICS
 // =====================================================
exports.getAnalytics = async (req, res) => {
    try {
        const [
            userStats,
            lostStats,
            foundStats,
            claimStats,
            monthlyRows,
            categoryRows,
            recentClaims
        ] = await Promise.all([
            query(`
                SELECT
                    COUNT(*) AS totalUsers,
                    SUM(CASE WHEN account_status = 'active' THEN 1 ELSE 0 END) AS activeUsers,
                    SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) AS verifiedUsers,
                    SUM(CASE WHEN verification_status = 'pending' THEN 1 ELSE 0 END) AS pendingUsers
                FROM users
                WHERE role = 'user'
            `),

            query(`
                SELECT COUNT(*) AS totalLost
                FROM lost_items
            `),

            query(`
                SELECT COUNT(*) AS totalFound
                FROM found_items
            `),

            query(`
                SELECT
                    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approvedClaims,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pendingClaims,
                    COUNT(*) AS totalClaims
                FROM claims
            `),

            query(`
                SELECT
                    months.month,
                    DATE_FORMAT(STR_TO_DATE(CONCAT(months.month, '-01'), '%Y-%m-%d'), '%b') AS label,
                    COALESCE(lost.total, 0) AS lostItems,
                    COALESCE(found.total, 0) AS foundItems
                FROM (
                    SELECT DATE_FORMAT(
                        DATE_SUB(CURDATE(), INTERVAL n MONTH), '%Y-%m'
                    ) AS month
                    FROM (
                        SELECT 0 AS n UNION ALL SELECT 1 UNION ALL
                        SELECT 2 UNION ALL SELECT 3 UNION ALL
                        SELECT 4 UNION ALL SELECT 5 UNION ALL
                        SELECT 6 UNION ALL SELECT 7 UNION ALL
                        SELECT 8 UNION ALL SELECT 9 UNION ALL
                        SELECT 10 UNION ALL SELECT 11
                    ) numbers
                ) months
                LEFT JOIN (
                    SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
                           COUNT(*) AS total
                    FROM lost_items
                    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                ) lost ON lost.month = months.month
                LEFT JOIN (
                    SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
                           COUNT(*) AS total
                    FROM found_items
                    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                ) found ON found.month = months.month
                ORDER BY months.month ASC
            `),

            query(`
                SELECT
                    c.category_name,
                    COUNT(items.category_id) AS total
                FROM item_categories c
                LEFT JOIN (
                    SELECT category_id FROM lost_items
                    UNION ALL
                    SELECT category_id FROM found_items
                ) items ON items.category_id = c.category_id
                GROUP BY c.category_id, c.category_name
                ORDER BY total DESC
                LIMIT 5
            `),

            query(`
                SELECT
                    cl.claim_id,
                    cl.status,
                    cl.created_at,
                    u.full_name,
                    fi.item_name,
                    c.category_name
                FROM claims cl
                LEFT JOIN users u ON cl.user_id = u.user_id
                LEFT JOIN found_items fi ON cl.found_item_id = fi.found_item_id
                LEFT JOIN item_categories c ON fi.category_id = c.category_id
                ORDER BY cl.created_at DESC
                LIMIT 5
            `)
        ]);

        const monthlyItems = monthlyRows.map(row => ({
            month: row.month,
            label: row.label,
            lostItems: Number(row.lostItems) || 0,
            foundItems: Number(row.foundItems) || 0
        }));

        const categoryTotal = categoryRows.reduce(
            (sum, row) => sum + Number(row.total || 0),
            0
        );

        const categoryStats = categoryRows.map(row => ({
            category_name: row.category_name,
            total: Number(row.total) || 0,
            percentage: categoryTotal
                ? Math.round((Number(row.total) / categoryTotal) * 100)
                : 0
        }));

        const analytics = {
            users: {
                totalUsers: Number(userStats[0]?.totalUsers) || 0,
                activeUsers: Number(userStats[0]?.activeUsers) || 0,
                verifiedUsers: Number(userStats[0]?.verifiedUsers) || 0,
                pendingUsers: Number(userStats[0]?.pendingUsers) || 0
            },
            lostItems: Number(lostStats[0]?.totalLost) || 0,
            foundItems: Number(foundStats[0]?.totalFound) || 0,
            claims: {
                totalClaims: Number(claimStats[0]?.totalClaims) || 0,
                approvedClaims: Number(claimStats[0]?.approvedClaims) || 0,
                pendingClaims: Number(claimStats[0]?.pendingClaims) || 0
            },
            monthlyItems,
            categoryStats,
            recentClaims
        };

        res.render('admin/admin-analytics', {
            analytics,
            activePage: 'analytics'
        });

    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).send('Failed to load analytics.');
    }
};

// =====================================================
// REPORTS
// Data source: users, lost_items, found_items,
//              item_categories
// =====================================================
exports.getReports = async (req, res) => {
    try {
        const [
            userCount,
            lostCount,
            foundCount,
            recentReports,
            reportCategories
        ] = await Promise.all([
            query('SELECT COUNT(*) AS total FROM users'),
            query('SELECT COUNT(*) AS total FROM lost_items'),
            query('SELECT COUNT(*) AS total FROM found_items'),

            query(`
                SELECT *
                FROM (
                    SELECT
                        li.lost_item_id AS id,
                        li.item_name,
                        'Lost' AS report_type,
                        u.full_name AS reported_by,
                        li.created_at,
                        COALESCE(li.status, 'Pending') AS status
                    FROM lost_items li
                    LEFT JOIN users u ON li.user_id = u.user_id

                    UNION ALL

                    SELECT
                        fi.found_item_id AS id,
                        fi.item_name,
                        'Found' AS report_type,
                        u.full_name AS reported_by,
                        fi.created_at,
                        COALESCE(fi.status, 'Pending') AS status
                    FROM found_items fi
                    LEFT JOIN users u ON fi.user_id = u.user_id
                ) AS all_reports
                ORDER BY created_at DESC
                LIMIT 20
            `),

            query(`
                SELECT
                    c.category_name,
                    (
                        SELECT COUNT(*)
                        FROM lost_items li
                        WHERE li.category_id = c.category_id
                    ) +
                    (
                        SELECT COUNT(*)
                        FROM found_items fi
                        WHERE fi.category_id = c.category_id
                    ) AS total
                FROM item_categories c
                ORDER BY total DESC
                LIMIT 4
            `)
        ]);

        const totalLost = Number(lostCount[0].total) || 0;
        const totalFound = Number(foundCount[0].total) || 0;

        res.render('admin/admin-reports', {
            totalUsers: Number(userCount[0].total) || 0,
            totalLost,
            totalFound,
            totalReports: totalLost + totalFound,
            recentReports: recentReports.length,
            reports: recentReports,
            reportCategories,
            activePage: 'reports'
        });

    } catch (err) {
        console.error('Reports error:', err);
        res.status(500).send(
            'Could not load reports. Check your database column names.'
        );
    }
};


// =====================================================
// ACTIVITY LOGS
// Data source: existing users table
// This shows account records, not a history of actions.
// =====================================================
exports.getActivityLogs = async (req, res) => {
    try {
        const logs = await query(`
            SELECT
                user_id,
                full_name,
                email,
                role,
                account_status,
                created_at
            FROM users
            ORDER BY created_at DESC
        `);

        res.render('admin/admin-activity-logs', {
            logs,
            activePage: 'activity-logs'
        });

    } catch (err) {
        console.error('Activity logs error:', err);
        res.status(500).send(
            'Could not load user records.'
        );
    }
};

exports.getActivityLogs = async (req, res) => {
    try {
        const logs = await query(`
            SELECT
                user_id,
                full_name,
                email,
                role,
                account_status,
                created_at
            FROM users
            ORDER BY created_at DESC
        `);

        res.render('admin/admin-activity-logs', {
            logs,
            activePage: 'activity-logs'
        });
    } catch (err) {
        console.error('Activity logs error:', err);
        res.status(500).send('Could not load user records.');
    }
};


/* ADMIN SETTINGS PAGE */
exports.getSettings = (req, res) => {
    res.render('admin/admin-settings', {
        activePage: 'settings'
    });
};


 // =====================================================
 // ANALYTICS
 // =====================================================
exports.getAnalytics = async (req, res) => {
    try {
        const [
            userStats,
            lostStats,
            foundStats,
            claimStats,
            monthlyRows,
            categoryRows,
            recentClaims
        ] = await Promise.all([
            query(`
                SELECT
                    COUNT(*) AS totalUsers,
                    SUM(CASE WHEN account_status = 'active' THEN 1 ELSE 0 END) AS activeUsers,
                    SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) AS verifiedUsers,
                    SUM(CASE WHEN verification_status = 'pending' THEN 1 ELSE 0 END) AS pendingUsers
                FROM users
                WHERE role = 'user'
            `),

            query(`
                SELECT COUNT(*) AS totalLost
                FROM lost_items
            `),

            query(`
                SELECT COUNT(*) AS totalFound
                FROM found_items
            `),

            query(`
                SELECT
                    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approvedClaims,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pendingClaims,
                    COUNT(*) AS totalClaims
                FROM claims
            `),

            query(`
                SELECT
                    months.month,
                    DATE_FORMAT(STR_TO_DATE(CONCAT(months.month, '-01'), '%Y-%m-%d'), '%b') AS label,
                    COALESCE(lost.total, 0) AS lostItems,
                    COALESCE(found.total, 0) AS foundItems
                FROM (
                    SELECT DATE_FORMAT(
                        DATE_SUB(CURDATE(), INTERVAL n MONTH), '%Y-%m'
                    ) AS month
                    FROM (
                        SELECT 0 AS n UNION ALL SELECT 1 UNION ALL
                        SELECT 2 UNION ALL SELECT 3 UNION ALL
                        SELECT 4 UNION ALL SELECT 5 UNION ALL
                        SELECT 6 UNION ALL SELECT 7 UNION ALL
                        SELECT 8 UNION ALL SELECT 9 UNION ALL
                        SELECT 10 UNION ALL SELECT 11
                    ) numbers
                ) months
                LEFT JOIN (
                    SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
                           COUNT(*) AS total
                    FROM lost_items
                    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                ) lost ON lost.month = months.month
                LEFT JOIN (
                    SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
                           COUNT(*) AS total
                    FROM found_items
                    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                ) found ON found.month = months.month
                ORDER BY months.month ASC
            `),

            query(`
                SELECT
                    c.category_name,
                    COUNT(items.category_id) AS total
                FROM item_categories c
                LEFT JOIN (
                    SELECT category_id FROM lost_items
                    UNION ALL
                    SELECT category_id FROM found_items
                ) items ON items.category_id = c.category_id
                GROUP BY c.category_id, c.category_name
                ORDER BY total DESC
                LIMIT 5
            `),

            query(`
                SELECT
                    cl.claim_id,
                    cl.status,
                    cl.created_at,
                    u.full_name,
                    fi.item_name,
                    c.category_name
                FROM claims cl
                LEFT JOIN users u ON cl.user_id = u.user_id
                LEFT JOIN found_items fi ON cl.found_item_id = fi.found_item_id
                LEFT JOIN item_categories c ON fi.category_id = c.category_id
                ORDER BY cl.created_at DESC
                LIMIT 5
            `)
        ]);

        const monthlyItems = monthlyRows.map(row => ({
            month: row.month,
            label: row.label,
            lostItems: Number(row.lostItems) || 0,
            foundItems: Number(row.foundItems) || 0
        }));

        const categoryTotal = categoryRows.reduce(
            (sum, row) => sum + Number(row.total || 0),
            0
        );

        const categoryStats = categoryRows.map(row => ({
            category_name: row.category_name,
            total: Number(row.total) || 0,
            percentage: categoryTotal
                ? Math.round((Number(row.total) / categoryTotal) * 100)
                : 0
        }));

        const analytics = {
            users: {
                totalUsers: Number(userStats[0]?.totalUsers) || 0,
                activeUsers: Number(userStats[0]?.activeUsers) || 0,
                verifiedUsers: Number(userStats[0]?.verifiedUsers) || 0,
                pendingUsers: Number(userStats[0]?.pendingUsers) || 0
            },
            lostItems: Number(lostStats[0]?.totalLost) || 0,
            foundItems: Number(foundStats[0]?.totalFound) || 0,
            claims: {
                totalClaims: Number(claimStats[0]?.totalClaims) || 0,
                approvedClaims: Number(claimStats[0]?.approvedClaims) || 0,
                pendingClaims: Number(claimStats[0]?.pendingClaims) || 0
            },
            monthlyItems,
            categoryStats,
            recentClaims
        };

        res.render('admin/admin-analytics', {
            analytics,
            activePage: 'analytics'
        });

    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).send('Failed to load analytics.');
    }
};

// =====================================================
// REPORTS
// Data source: users, lost_items, found_items,
//              item_categories
// =====================================================
exports.getReports = async (req, res) => {
    try {
        const [
            userCount,
            lostCount,
            foundCount,
            recentReports,
            reportCategories
        ] = await Promise.all([
            query('SELECT COUNT(*) AS total FROM users'),
            query('SELECT COUNT(*) AS total FROM lost_items'),
            query('SELECT COUNT(*) AS total FROM found_items'),

            query(`
                SELECT *
                FROM (
                    SELECT
                        li.lost_item_id AS id,
                        li.item_name,
                        'Lost' AS report_type,
                        u.full_name AS reported_by,
                        li.created_at,
                        COALESCE(li.status, 'Pending') AS status
                    FROM lost_items li
                    LEFT JOIN users u ON li.user_id = u.user_id

                    UNION ALL

                    SELECT
                        fi.found_item_id AS id,
                        fi.item_name,
                        'Found' AS report_type,
                        u.full_name AS reported_by,
                        fi.created_at,
                        COALESCE(fi.status, 'Pending') AS status
                    FROM found_items fi
                    LEFT JOIN users u ON fi.user_id = u.user_id
                ) AS all_reports
                ORDER BY created_at DESC
                LIMIT 20
            `),

            query(`
                SELECT
                    c.category_name,
                    (
                        SELECT COUNT(*)
                        FROM lost_items li
                        WHERE li.category_id = c.category_id
                    ) +
                    (
                        SELECT COUNT(*)
                        FROM found_items fi
                        WHERE fi.category_id = c.category_id
                    ) AS total
                FROM item_categories c
                ORDER BY total DESC
                LIMIT 4
            `)
        ]);

        const totalLost = Number(lostCount[0].total) || 0;
        const totalFound = Number(foundCount[0].total) || 0;

        res.render('admin/admin-reports', {
            totalUsers: Number(userCount[0].total) || 0,
            totalLost,
            totalFound,
            totalReports: totalLost + totalFound,
            recentReports: recentReports.length,
            reports: recentReports,
            reportCategories,
            activePage: 'reports'
        });

    } catch (err) {
        console.error('Reports error:', err);
        res.status(500).send(
            'Could not load reports. Check your database column names.'
        );
    }
};


// =====================================================
// ACTIVITY LOGS
// Data source: existing users table
// This shows account records, not a history of actions.
// =====================================================
exports.getActivityLogs = async (req, res) => {
    try {
        const logs = await query(`
            SELECT
                user_id,
                full_name,
                email,
                role,
                account_status,
                created_at
            FROM users
            ORDER BY created_at DESC
        `);

        res.render('admin/admin-activity-logs', {
            logs,
            activePage: 'activity-logs'
        });

    } catch (err) {
        console.error('Activity logs error:', err);
        res.status(500).send(
            'Could not load user records.'
        );
    }
};

exports.getActivityLogs = async (req, res) => {
    try {
        const logs = await query(`
            SELECT
                user_id,
                full_name,
                email,
                role,
                account_status,
                created_at
            FROM users
            ORDER BY created_at DESC
        `);

        res.render('admin/admin-activity-logs', {
            logs,
            activePage: 'activity-logs'
        });
    } catch (err) {
        console.error('Activity logs error:', err);
        res.status(500).send('Could not load user records.');
    }
};


/* ADMIN SETTINGS PAGE */
exports.getSettings = (req, res) => {
    res.render('admin/admin-settings', {
        activePage: 'settings'
    });
};