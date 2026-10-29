// Stores admin activity in a local append-only JSONL file. This uses no extra
// database table, so activity logging works with the supplied schema as-is.
const fs = require("fs");
const path = require("path");

const ACTIVITY_FILE = path.join(__dirname, "..", "data", "admin-activity.jsonl");

async function readAdminActivity() {
  try {
    const contents = await fs.promises.readFile(ACTIVITY_FILE, "utf8");
    return contents
      .split(/\r?\n/)
      .filter(Boolean)
      .flatMap((line) => {
        try {
          const entry = JSON.parse(line);
          return entry && entry.log_id ? [entry] : [];
        } catch {
          return [];
        }
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function logAdminAction(req, action, opts = {}) {
  // Support both existing call styles: (req, "ACTION", options) and
  // (req, { action: "ACTION", details: "..." }).
  if (action && typeof action === "object") {
    opts = action;
    action = opts.action;
  }

  const user = req.session?.user;
  const adminId = opts.adminId ?? user?.user_id;
  if (!adminId || !action) return;

  const forwarded = req.headers?.["x-forwarded-for"];
  const ip = String(
    forwarded ? String(forwarded).split(",")[0] : req.ip || req.socket?.remoteAddress || "",
  )
    .trim()
    .replace(/^::ffff:/, "")
    .slice(0, 45) || null;

  const entry = {
    log_id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    admin_id: Number(adminId),
    admin_name: user?.full_name || user?.username || null,
    admin_email: user?.email || null,
    admin_image: user?.profile_image || null,
    action: String(action).slice(0, 50),
    target_type: opts.targetType || null,
    target_id: opts.targetId ?? null,
    details: opts.details ? String(opts.details).slice(0, 255) : null,
    ip_address: ip,
    created_at: new Date().toISOString(),
  };

  try {
    await fs.promises.mkdir(path.dirname(ACTIVITY_FILE), { recursive: true });
    await fs.promises.appendFile(ACTIVITY_FILE, `${JSON.stringify(entry)}\n`, "utf8");
  } catch (err) {
    console.error("Admin activity log write failed:", err.message);
  }
}

async function getAdminLoginTimes() {
  const entries = await readAdminActivity();
  const latest = new Map();
  for (const entry of entries) {
    if (entry.action === "LOGIN" && !latest.has(entry.admin_id)) {
      latest.set(entry.admin_id, entry.created_at);
    }
  }
  return latest;
}

const getAdminId = (req) => req.session?.user?.user_id || null;

module.exports = {
  logAdminAction,
  readAdminActivity,
  getAdminLoginTimes,
  getAdminId,
};
