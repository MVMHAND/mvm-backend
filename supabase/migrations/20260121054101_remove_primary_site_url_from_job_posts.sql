-- Migration: Remove primary_site_url from job_posts table
-- This field is now dynamically generated from environment variables

BEGIN;

-- Step 1: Drop any indexes on primary_site_url (if any exist)
DROP INDEX IF EXISTS idx_job_posts_primary_site_url;

-- Step 2: Remove the column
ALTER TABLE job_posts
DROP COLUMN IF EXISTS primary_site_url;

COMMIT;
