-- Verificar y corregir la tabla api_keys
USE chatgpt;

-- Verificar la estructura actual de la tabla
DESCRIBE api_keys;

-- Si la tabla no existe, crearla
CREATE TABLE IF NOT EXISTS api_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    api_key VARCHAR(64) UNIQUE NOT NULL,
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

-- Verificar que la tabla users existe
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Mostrar las tablas existentes
SHOW TABLES;

-- Mostrar algunos datos de prueba
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as api_key_count FROM api_keys;
