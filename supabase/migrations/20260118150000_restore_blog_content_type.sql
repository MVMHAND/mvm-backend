-- ============================================
-- Restore content_type to blog_posts
-- ============================================
-- The content_type_enum was accidentally dropped in 20260118113500_refine_job_posts_schema.sql
-- This migration restores it for blog_posts table only

-- Recreate content_type_enum (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_type_enum') THEN
        CREATE TYPE content_type_enum AS ENUM ('tiptap', 'html');
    END IF;
END
$$;

-- Add content_type column back to blog_posts table
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS content_type content_type_enum DEFAULT 'tiptap' NOT NULL;

-- Update any existing posts to ensure they have 'tiptap' type (safety measure)
UPDATE blog_posts 
SET content_type = 'tiptap' 
WHERE content_type IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN blog_posts.content_type IS 'Content format: tiptap for Tiptap editor JSON, html for raw HTML (legacy migration)';
