-- Migration: Add is_admin field to users table
-- Date: 2024-12-20
-- Description: Adds administrator functionality to users

-- Add is_admin field to users table
ALTER TABLE users 
ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Add index for better performance on admin queries
CREATE INDEX idx_users_is_admin ON users(is_admin);

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin(user_telegram_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE((
        SELECT is_admin 
        FROM users 
        WHERE telegram_id = user_telegram_id
        LIMIT 1
    ), FALSE);
END;
$$ LANGUAGE plpgsql;

-- Create a function to set user as admin (for manual admin promotion)
CREATE OR REPLACE FUNCTION set_user_admin(user_telegram_id BIGINT, admin_status BOOLEAN DEFAULT TRUE)
RETURNS BOOLEAN AS $$
DECLARE
    updated_rows INTEGER;
BEGIN
    UPDATE users 
    SET is_admin = admin_status,
        updated_at = NOW()
    WHERE telegram_id = user_telegram_id;
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    
    IF updated_rows > 0 THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- RLS Policy: Admins can view all users (including admin status)
CREATE POLICY "Admins can view all users"
    ON users FOR SELECT
    USING (
        -- Admin users can see all user data including is_admin field
        is_user_admin((current_setting('app.current_user_telegram_id', true))::bigint)
        OR 
        -- Regular users can see basic user info but not admin status (handled in application layer)
        telegram_id = COALESCE(
            (current_setting('app.current_user_telegram_id', true))::bigint,
            0
        )
    );

-- Comments for documentation
COMMENT ON COLUMN users.is_admin IS 'Whether the user has administrator privileges';
COMMENT ON FUNCTION is_user_admin(BIGINT) IS 'Check if a user has admin privileges';
COMMENT ON FUNCTION set_user_admin(BIGINT, BOOLEAN) IS 'Set admin status for a user (for manual promotion)'; 