-- Add chat sessions table for managing multiple chats
CREATE TABLE IF NOT EXISTS chat_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_name VARCHAR(255) DEFAULT 'New Chat',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_updated (user_id, updated_at DESC)
);

-- Add session_id to chat_history table
ALTER TABLE chat_history ADD COLUMN session_id INT DEFAULT NULL;
ALTER TABLE chat_history ADD FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE;
ALTER TABLE chat_history ADD INDEX idx_session_timestamp (session_id, timestamp);

-- Create default session for existing users
INSERT INTO chat_sessions (user_id, session_name)
SELECT DISTINCT user_id, 'Default Chat'
FROM chat_history
WHERE user_id NOT IN (SELECT user_id FROM chat_sessions);

-- Update existing chat history to link to default sessions
UPDATE chat_history ch
JOIN chat_sessions cs ON ch.user_id = cs.user_id
SET ch.session_id = cs.id
WHERE ch.session_id IS NULL;
