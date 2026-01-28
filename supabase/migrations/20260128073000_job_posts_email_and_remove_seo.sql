-- Migration: Add application_email and remove SEO fields from job_posts
-- Date: 2026-01-28

-- Step 1: Add application_email column
ALTER TABLE job_posts
  ADD COLUMN IF NOT EXISTS application_email VARCHAR(255);

-- Step 2: Remove SEO fields
ALTER TABLE job_posts
  DROP COLUMN IF EXISTS seo_meta_title,
  DROP COLUMN IF EXISTS seo_meta_description;

-- Step 3: Update existing posts with creator's email
UPDATE job_posts jp
SET application_email = (
  SELECT email FROM auth.users u WHERE u.id = jp.created_by
)
WHERE jp.application_email IS NULL AND jp.created_by IS NOT NULL;

-- Step 4: Fallback to default email for any remaining NULL values
UPDATE job_posts
SET application_email = 'careers@myvirtualmate.com'
WHERE application_email IS NULL;

-- Step 5: Add NOT NULL constraint after populating
ALTER TABLE job_posts 
  ALTER COLUMN application_email SET NOT NULL;

-- Step 6: Add descriptive comment
COMMENT ON COLUMN job_posts.application_email IS 'Email address where candidates should apply';
