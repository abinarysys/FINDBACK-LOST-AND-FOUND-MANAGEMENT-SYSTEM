-- Run ONCE in MySQL Workbench against findback_db.
-- Stores each user's appearance settings (Settings page).
USE findback_db;

ALTER TABLE users
  ADD COLUMN theme_mode ENUM('light','dark') NOT NULL DEFAULT 'light' AFTER verification_status,
  ADD COLUMN theme_color CHAR(7) NOT NULL DEFAULT '#4F46E5' AFTER theme_mode;

-- Check:
-- SELECT user_id, theme_mode, theme_color FROM users;
