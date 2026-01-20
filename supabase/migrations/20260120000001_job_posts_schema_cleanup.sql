-- ============================================
-- Job Posts Schema Cleanup Migration
-- ============================================
-- This migration:
-- 1. Removes 'slug' and 'description' from job_categories (not needed)
-- 2. Removes 'cover_image_url' and 'application_process' from job_posts (unused)
-- 3. Adds 'published_by' to job_posts (like blog_posts)

-- ============================================
-- Remove unused columns from job_categories
-- ============================================

-- Drop slug column and its index
DROP INDEX IF EXISTS idx_job_categories_slug;
ALTER TABLE job_categories DROP COLUMN IF EXISTS slug;

-- Drop description column
ALTER TABLE job_categories DROP COLUMN IF EXISTS description;

-- ============================================
-- Remove unused columns from job_posts
-- ============================================

-- Drop cover_image_url (never used in the form)
ALTER TABLE job_posts DROP COLUMN IF EXISTS cover_image_url;

-- Drop application_process (never saved from form, always empty)
ALTER TABLE job_posts DROP COLUMN IF EXISTS application_process;

-- ============================================
-- Add published_by to job_posts (like blog_posts)
-- ============================================

-- Add published_by column with foreign key to users
ALTER TABLE job_posts 
  ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES users(id);

-- Add comment
COMMENT ON COLUMN job_posts.published_by IS 'User who published this job post';

-- Create index for published_by
CREATE INDEX IF NOT EXISTS idx_job_posts_published_by ON job_posts(published_by);
