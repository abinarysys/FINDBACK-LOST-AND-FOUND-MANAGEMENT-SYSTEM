-- Run once in MySQL Workbench / CLI against findback_db
USE findback_db;

-- who reviewed the claim, when, and an optional note for the claimant
ALTER TABLE claims
  ADD COLUMN reviewed_by INT NULL,
  ADD COLUMN reviewed_at TIMESTAMP NULL,
  ADD COLUMN admin_note VARCHAR(255) NULL,
  ADD CONSTRAINT fk_claims_reviewer FOREIGN KEY (reviewed_by)
      REFERENCES users (user_id) ON DELETE SET NULL;

-- claim status values used by the app: 'pending' | 'verified' | 'rejected'
-- found_items.status used by the app:   'available' | 'reserved' (verified claim, waiting for pickup)

CREATE TABLE IF NOT EXISTS notifications (
  notification_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  type VARCHAR(30) NOT NULL,
  title VARCHAR(120) NOT NULL,
  message VARCHAR(500) NOT NULL,
  link VARCHAR(255) DEFAULT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (notification_id),
  KEY idx_notif_user (user_id, is_read),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
