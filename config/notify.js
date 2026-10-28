const query = require("./query");

const INSERT_SQL = `INSERT INTO notifications
    (user_id, type, title, message, link, found_item_id, claim_id, related_user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`; 

/**
 * @param {Function} run  
 *                        
 * @returns 
 */
async function createNotification(run, userId, notification) {
  if (!userId) {
    throw new Error("A valid user ID is required.");
  }

  const {type, title, message,  link = "/user/notifications", found_item_id = null, claim_id = null,
    related_user_id = null,} = notification;

  let result;

  try {
    result = await run(INSERT_SQL, [userId, type, title, message, link, found_item_id,
      claim_id, related_user_id,]);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return null;
    throw error;
  }

  return {notification_id: result.insertId, user_id: userId, type, title, message, link,
    found_item_id, claim_id, related_user_id, is_read: 0, created_at: new Date(), };
}

function emitNotification(io, notification) {
  if (!io || !notification) return;
  io.to(`user:${notification.user_id}`).emit("notification", notification);
}

async function notifyUser(io, userId, notification) {
  const saved = await createNotification(query, userId, notification);
  emitNotification(io, saved);
  return saved;
}

module.exports = { createNotification, emitNotification, notifyUser };
