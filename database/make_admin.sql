-- Manual script to make a user administrator
-- Replace TELEGRAM_ID_HERE with the actual Telegram ID you want to make admin

-- Set user as admin (replace 123456789 with actual Telegram ID)
UPDATE users 
SET is_admin = true, 
    updated_at = NOW()
WHERE telegram_id = 123456789;

-- Check if user was updated
SELECT 
    telegram_id,
    first_name,
    last_name,
    username,
    is_admin,
    created_at,
    updated_at
FROM users 
WHERE telegram_id = 123456789;

-- Alternative: Use the function to set admin status
-- SELECT set_user_admin(123456789, true);

-- List all admins
SELECT 
    telegram_id,
    first_name,
    last_name,
    username,
    is_admin,
    created_at
FROM users 
WHERE is_admin = true
ORDER BY created_at DESC;

-- Examples for common use cases:
-- Make user admin: UPDATE users SET is_admin = true WHERE telegram_id = YOUR_TELEGRAM_ID;
-- Remove admin: UPDATE users SET is_admin = false WHERE telegram_id = YOUR_TELEGRAM_ID;
-- Check admin status: SELECT telegram_id, first_name, is_admin FROM users WHERE telegram_id = YOUR_TELEGRAM_ID; 