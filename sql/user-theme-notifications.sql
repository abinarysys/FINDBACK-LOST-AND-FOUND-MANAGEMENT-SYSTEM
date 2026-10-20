-- Run ONCE in MySQL Workbench against findback_db.
-- Adds notification references and prevents duplicate claim notifications.
USE findback_db;

ALTER TABLE notifications
  ADD COLUMN found_item_id INT NULL AFTER link,
  ADD COLUMN claim_id INT NULL AFTER found_item_id,
  ADD COLUMN related_user_id INT NULL AFTER claim_id,
  MODIFY COLUMN message TEXT NOT NULL,
  ADD CONSTRAINT fk_notif_found_item
    FOREIGN KEY (found_item_id) REFERENCES found_items (found_item_id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_notif_claim
    FOREIGN KEY (claim_id) REFERENCES claims (claim_id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_notif_related_user
    FOREIGN KEY (related_user_id) REFERENCES users (user_id) ON DELETE SET NULL,
  ADD UNIQUE KEY uq_notif_claim_type (claim_id, type);
