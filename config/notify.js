const query = require('./query');

// Save a notification and send it to the intended user in real time.
async function notifyUser(io, userId, notification) {
    if (!userId) {
        throw new Error('A valid user ID is required to send a notification.');
    }

    const { type, title, message, link = null } = notification;

    // Save notification in the database.
    await query(
        `INSERT INTO notifications
            (user_id, type, title, message, link)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, type, title, message, link]
    );

    // Send notification to the user's private Socket.IO room.
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
