CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    client_key VARCHAR(128),
    role VARCHAR(16) DEFAULT 'user', -- user, alpha, beta
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 