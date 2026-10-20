-- sql/chat.sql
-- Run ONCE in MySQL Workbench on findback_db. Uses your existing chat tables
-- (conversations, conversation_participants, messages): no new tables.
USE findback_db;

-- Remembers, per person per conversation, the last message they have read.
-- Unread = messages from the other person with a higher id than this number.
ALTER TABLE conversation_participants
  ADD COLUMN last_read_message_id INT NOT NULL DEFAULT 0 AFTER joined_at;

-- Makes "latest messages of one conversation" fast.
ALTER TABLE messages
  ADD KEY idx_msg_conv_id (conversation_id, message_id);
