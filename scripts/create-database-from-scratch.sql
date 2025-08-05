-- Crear base de datos desde cero
DROP DATABASE IF EXISTS chatgpt;
CREATE DATABASE chatgpt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chatgpt;

-- Tabla de usuarios
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username)
);

-- Tabla de sesiones de chat
CREATE TABLE chat_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_name VARCHAR(255) DEFAULT 'New Chat',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_updated (user_id, updated_at DESC)
);

-- Tabla de historial de chat
CREATE TABLE chat_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_id INT DEFAULT NULL,
    message_id VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    role ENUM('user', 'assistant') NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    INDEX idx_user_timestamp (user_id, timestamp),
    INDEX idx_session_timestamp (session_id, timestamp)
);

-- Tabla de API keys (CORREGIDA - VARCHAR más grande)
CREATE TABLE api_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    api_key VARCHAR(128) UNIQUE NOT NULL,  -- Aumentado de 64 a 128
    name VARCHAR(100) NOT NULL,
    credits_used INT DEFAULT 0,
    credits_limit INT DEFAULT 1000,
    last_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_api_key (api_key),
    INDEX idx_user_active (user_id, is_active)
);

-- Insertar usuario de prueba (opcional)
INSERT INTO users (username, email, password_hash) VALUES 
('demo_user', 'demo@example.com', '$2b$10$example_hash_here_for_testing_purposes_only');

-- Verificar que todo se creó correctamente
SHOW TABLES;
DESCRIBE users;
DESCRIBE chat_sessions;
DESCRIBE chat_history;
DESCRIBE api_keys;

-- Mostrar información de las tablas
SELECT 'Users table created' as status, COUNT(*) as count FROM users;
SELECT 'Chat sessions table created' as status, COUNT(*) as count FROM chat_sessions;
SELECT 'Chat history table created' as status, COUNT(*) as count FROM chat_history;
SELECT 'API keys table created' as status, COUNT(*) as count FROM api_keys;
