-- Migration: Add content_type column to blog_posts table
-- Purpose: Support both Tiptap editor content and raw HTML for legacy blog migration

-- Create enum for content type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_type_enum') THEN
        CREATE TYPE content_type_enum AS ENUM ('tiptap', 'html');
    END IF;
END
$$;

-- Add content_type column to blog_posts table with default 'tiptap'
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS content_type content_type_enum DEFAULT 'tiptap' NOT NULL;

-- Update any existing posts to ensure they have 'tiptap' type (safety measure)
UPDATE blog_posts 
SET content_type = 'tiptap' 
WHERE content_type IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN blog_posts.content_type IS 'Content format: tiptap for Tiptap editor JSON, html for raw HTML (legacy migration)';
