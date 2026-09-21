-- Update seeded user accounts with valid BCrypt hash for 'password123'
UPDATE users 
SET password_hash = '$2a$10$cYxJOV0H1LC8T/YWix83i.531sK/gFjZdpKtRp5aEtKV24mUf2DBG'
WHERE user_id IN ('A001', 'S001', 'W001');
