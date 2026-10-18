const query = require('./query');

async function notifyUser(io, userId, notification) {
    if (!userId) {
        throw new Error('A valid user ID is required.');
    }

    const {
        type,
        title,
        message,
        link = '/user/notifications',
        found_item_id = null,
        claim_id = null,
        related_user_id = null
    } = notification;

    const result = await query(
        `INSERT INTO notifications
            (user_id, type, title, message, link,
             found_item_id, claim_id, related_user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            userId,
            type,
            title,
            message,
            link,
            found_item_id,
            claim_id,
            related_user_id
        ]
    );

    const newNotification = {
        notification_id: result.insertId,
        user_id: userId,
        type,
        title,
        message,
        link,
        found_item_id,
        claim_id,
        related_user_id,
        is_read: 0,
        created_at: new Date()
    };

    if (io) {
        io.to(`user:${userId}`).emit(
            'notification',
            newNotification
        );
    }

    return newNotification;
}

module.exports = { notifyUser };