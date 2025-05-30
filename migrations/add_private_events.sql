-- Migration: Add private events functionality
-- Adds support for private events with invitations

-- Add is_private field to events table
ALTER TABLE events 
ADD COLUMN is_private BOOLEAN NOT NULL DEFAULT FALSE;

-- Add index for better performance on private events queries
CREATE INDEX idx_events_is_private ON events(is_private);

-- Create event_invitations table for managing invitations to private events
CREATE TABLE event_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    invited_by_telegram_id BIGINT NOT NULL REFERENCES users(telegram_id),
    invited_telegram_id BIGINT NOT NULL,
    invited_first_name TEXT NOT NULL,
    invited_last_name TEXT,
    invited_username TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure no duplicate invitations for the same user to the same event
    UNIQUE(event_id, invited_telegram_id)
);

-- Add indexes for better performance
CREATE INDEX idx_event_invitations_event_id ON event_invitations(event_id);
CREATE INDEX idx_event_invitations_invited_telegram_id ON event_invitations(invited_telegram_id);
CREATE INDEX idx_event_invitations_status ON event_invitations(status);

-- Add RLS policies for event_invitations
ALTER TABLE event_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view invitations for events they created or were invited to
CREATE POLICY "Users can view relevant invitations"
    ON event_invitations FOR SELECT
    USING (
        invited_by_telegram_id = (SELECT telegram_id FROM users WHERE auth.uid() = id)
        OR invited_telegram_id = (SELECT telegram_id FROM users WHERE auth.uid() = id)
    );

-- Policy: Users can insert invitations for events they created
CREATE POLICY "Event creators can invite users"
    ON event_invitations FOR INSERT
    WITH CHECK (
        invited_by_telegram_id = (SELECT telegram_id FROM users WHERE auth.uid() = id)
        AND EXISTS (
            SELECT 1 FROM events 
            WHERE id = event_id 
            AND created_by = invited_by_telegram_id
        )
    );

-- Policy: Invited users can update their invitation status
CREATE POLICY "Invited users can update invitation status"
    ON event_invitations FOR UPDATE
    USING (invited_telegram_id = (SELECT telegram_id FROM users WHERE auth.uid() = id))
    WITH CHECK (invited_telegram_id = (SELECT telegram_id FROM users WHERE auth.uid() = id));

-- Policy: Event creators can delete invitations
CREATE POLICY "Event creators can delete invitations"
    ON event_invitations FOR DELETE
    USING (
        invited_by_telegram_id = (SELECT telegram_id FROM users WHERE auth.uid() = id)
        AND EXISTS (
            SELECT 1 FROM events 
            WHERE id = event_id 
            AND created_by = invited_by_telegram_id
        )
    );

-- Update the events view policy to handle private events
-- Drop existing policy
DROP POLICY IF EXISTS "Users can view events" ON events;

-- Create new policy that handles private events
CREATE POLICY "Users can view public events or private events they're invited to"
    ON events FOR SELECT
    USING (
        -- Public events are visible to everyone
        is_private = FALSE
        OR 
        -- Private events are visible to creators
        created_by = (SELECT telegram_id FROM users WHERE auth.uid() = id)
        OR
        -- Private events are visible to invited users
        (
            is_private = TRUE 
            AND EXISTS (
                SELECT 1 FROM event_invitations 
                WHERE event_id = events.id 
                AND invited_telegram_id = (SELECT telegram_id FROM users WHERE auth.uid() = id)
            )
        )
    );

-- Add comment for documentation
COMMENT ON TABLE event_invitations IS 'Stores invitations for private events';
COMMENT ON COLUMN events.is_private IS 'Whether the event is private (invite-only) or public';
COMMENT ON COLUMN event_invitations.status IS 'Invitation status: pending, accepted, declined'; 