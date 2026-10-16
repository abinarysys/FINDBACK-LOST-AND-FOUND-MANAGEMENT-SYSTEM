-- sql/admin-update.sql
-- Run once on your database (e.g. in phpMyAdmin / MySQL Workbench / mysql CLI).
-- Safe to run more than once.

CREATE TABLE IF NOT EXISTS admin_activity_logs (
    log_id      INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    admin_id    INT NULL,
    action      VARCHAR(50)  NOT NULL,
    target_type VARCHAR(50)  NULL,
    target_id   INT NULL,
    details     VARCHAR(500) NULL,
    ip_address  VARCHAR(64)  NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admin_logs_admin   (admin_id),
    INDEX idx_admin_logs_action  (action),
    INDEX idx_admin_logs_created (created_at)
);
