const query = require('../config/query');

exports.getNotifications = async (req, res) => {
    try {
        const userId = req.session.user?.user_id;

        if (!userId) {
            return res.redirect('/auth/login');
        }

        const notifications = await query(
            `SELECT
                n.notification_id,
                n.user_id,
                n.type,
                n.title,
                n.message,
                n.link,
                n.is_read,
                n.created_at,
                n.found_item_id,
                n.claim_id,
                n.related_user_id,

                fi.item_name,
                fi.description AS item_description,
                fi.location AS item_location,
                fi.date_found,
                fi.photo_path,
                fi.status AS item_status,

                cat.category_name,

                other_user.full_name AS related_user_name

             FROM notifications n

             LEFT JOIN found_items fi
                ON fi.found_item_id = n.found_item_id

             LEFT JOIN item_categories cat
                ON cat.category_id = fi.category_id

             LEFT JOIN users other_user
                ON other_user.user_id = n.related_user_id

             WHERE n.user_id = ?

             ORDER BY n.created_at DESC
             LIMIT 50`,
            [userId]
        );

        res.render('user/notifications', {
            user: req.session.user,
            notifications
        });
    } catch (error) {
        console.error('Error loading notifications:', error);
        req.flash('error', 'Unable to load notifications.');
        res.redirect('/');
    }
};