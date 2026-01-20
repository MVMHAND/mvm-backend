-- Migration: Rename requirements to must_have_skills in job_posts table
-- This makes the field name more descriptive and consistent with UI terminology

-- Rename the column
ALTER TABLE job_posts 
RENAME COLUMN requirements TO must_have_skills;

-- Update the column comment for clarity
COMMENT ON COLUMN job_posts.must_have_skills IS 'Required skills and qualifications for the position';
