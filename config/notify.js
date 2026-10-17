const query = require('./query');

// Save the notification to MySQL and send it live to the user's private room.
async function notifyUser(io, userId, notification) {
    if (!userId) {
        throw new Error('A valid user ID is required to send a notification.');
    }

    const { type, title, message, link = null } = notification;

    // Save notification so the user can see it later.
    await query(
        `INSERT INTO notifications (user_id, type, title, message, link)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, type, title, message, link]
    );

    // Send the notification immediately if Socket.IO is available.
    if (io) {
        io.to(`user:${userId}`).emit('notification', {
            type,
            title,
            message,
            link
        });
    }
}

module.exports = { notifyUser };
