// MODULES
const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const db = require('../config/db.js');

// MIDDLEWARES
const authMiddleware = require('../middleware/auth-middleware.js');
const upload = require('../middleware/upload-middleware.js');

// VIEW PROFILE
router.get('/profile', authMiddleware, (req, res) => {
    const userId = req.session.user.user_id;
    const getUser = `SELECT * FROM users WHERE user_id = ?`
    db.query(getUser, [userId], (err, results) => {
        if (err) {
            console.error(err);
            req.flash("error", 'Failed to retrieve user profile.');
            return res.redirect('auth/login');
        }
        if (results.length === 0) {
            req.flash('error', "User not found.");
            return res.redirect('auth/login');
        }
        res.render('user/user-profile', { user: results[0]});       
    })
})

// GO TO EDIT PROFILE PAGE
router.get('/profile/edit', authMiddleware, (req, res) => {
    const userId = req.session.user.user_id;
    const edit = `SELECT * FROM users WHERE user_id = ?`
    db.query(edit, [userId],(err, results) => {
        if (err) {
            console.error(err);
            req.flash('error', 'Failed to load edit profile page.');
            return res.redirect('user/profile');
        }
        if (results.length === 0) {
            req.flash('error', 'User not found.');
            return res.redirect('auth/login');
        }
        res.render('user/profile_edit', {user: results[0]})
    })
})

// EDIT PROFILE
router.post('/profile/update', authMiddleware, (req, res, next) => {
        upload.single('profile_image')(req, res, (err) => {
            if (err) {
                console.error("Upload profile picture error: ", err);
                req.flash('error', err.message || 'Profile picture upload failed.');
                return res.redirect('/user/profile/edit');
            }
            next();
        })
    },
    (req, res) => {
        const userId = req.session.user.user_id;
        const { full_name, contact_number } = req.body;
        if (!full_name?.trim() || !contact_number?.trim()) {
            req.flash('error', 'Full name and contact number are required.');
            return res.redirect('/user/profile/edit');
        }

        if (full_name.trim().length > 100 || contact_number.trim().length > 20) {
            req.flash('error', 'Please check the length of your information.');
            return res.redirect('/user/profile/edit');
        }
        let sql = `UPDATE users SET full_name = ?, contact_number = ?`
        const params = [full_name.trim(), contact_number.trim()]
        if (req.file) {
            sql += ', profile_image = ?'
            params.push('/uploads/' + req.file.filename)
        }
        sql += ' WHERE user_id = ?'
        params.push(userId)
        db.query(sql, params, (err) => {
            if (err) {
                console.error('Database update error:', err);
                req.flash('error', 'Failed to update your profile.');
                return res.redirect('/user/profile/edit');
            }
            req.session.user.full_name = full_name.trim();
            req.session.user.username = full_name.trim();
            req.session.user.num = contact_number.trim();
            if (req.file) {
                req.session.user.profile_image =
                    '/uploads/' + req.file.filename;
            }
            req.flash('success', 'Profile updated successfully.');
            return res.redirect('/user/profile');
        });
    }
);

const query = require('../config/query.js');

router.get("/activity-logs", (req, res) => {
    const sessionUser = req.session && req.session.user;
    if (!sessionUser) return res.redirect('/auth/login');
    const userId = sessionUser.user_id;

    const lostSql = `SELECT lost_items.*, item_categories.category_name
        FROM lost_items
        LEFT JOIN item_categories ON lost_items.category_id = item_categories.category_id
        WHERE lost_items.user_id = ?`;
    const foundSql = `SELECT found_items.*, item_categories.category_name
        FROM found_items
        LEFT JOIN item_categories ON found_items.category_id = item_categories.category_id
        WHERE found_items.user_id = ?`;

    db.query(lostSql, [userId], (err, lostRows) => {
        if (err) { console.error(err); return res.status(500).send("Could not load your activity"); }

        db.query(foundSql, [userId], (err, foundRows) => {
            if (err) { console.error(err); return res.status(500).send("Could not load your activity"); }

            const shape = (item, type) => ({
                type,
                itemId: item.item_id ?? item.lost_id ?? item.found_id ?? item.id,
                title: item.item_name || item.category_name || 'Unnamed item',
                category_name: item.category_name,
                location: item.location,
                status: item.status,          // shows only if your table has a "status" column
                created_at: item.created_at
            });

            const activities = [
                ...lostRows.map(i => shape(i, 'lost')),
                ...foundRows.map(i => shape(i, 'found'))
            ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            res.render("user/activity", {
                activities,
                stats: { total: activities.length, lost: lostRows.length, found: foundRows.length }
            });
        });
    });
});


module.exports = router;