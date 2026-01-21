-- ============================================
-- Serial Job ID and Rich Text Fields Migration
-- ============================================
-- 1. Changes job_id generation from random to sequential (JOB-000001, JOB-000002, etc.)
-- 2. Converts responsibilities, must_have_skills, preferred_skills, benefits from JSONB arrays to TEXT (HTML)

-- ============================================
-- PART 1: Serial Job ID Generation
-- ============================================

-- Update the generate_job_id function to use sequential IDs with collision detection
CREATE OR REPLACE FUNCTION generate_job_id()
RETURNS TRIGGER AS $$
DECLARE
  last_numeric_id INTEGER;
  next_id INTEGER;
  new_job_id VARCHAR(20);
  counter INTEGER := 0;
BEGIN
  -- Get the highest numeric portion from existing job_ids
  SELECT COALESCE(MAX(SUBSTRING(job_id FROM 5)::INTEGER), 0)
  INTO last_numeric_id
  FROM job_posts
  WHERE job_id ~ '^JOB-[0-9]+$';
  
  -- Start from next sequential number
  next_id := last_numeric_id + 1;
  
  -- Try up to 100 times to find an available ID
  LOOP
    new_job_id := 'JOB-' || LPAD(next_id::TEXT, 6, '0');
    
    -- Check if this ID exists
    IF NOT EXISTS (SELECT 1 FROM job_posts WHERE job_id = new_job_id) THEN
      EXIT;
    END IF;
    
    -- Increment and try next
    next_id := next_id + 1;
    counter := counter + 1;
    
    IF counter > 100 THEN
      RAISE EXCEPTION 'Failed to generate unique job_id after 100 attempts';
    END IF;
  END LOOP;
  
  NEW.job_id := new_job_id;
  NEW.slug := new_job_id; -- Slug is same as job_id
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 2: Convert JSONB arrays to TEXT (HTML)
-- ============================================

-- Add new TEXT columns for rich text content
ALTER TABLE job_posts
  ADD COLUMN IF NOT EXISTS responsibilities_html TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS must_have_skills_html TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS preferred_skills_html TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS benefits_html TEXT DEFAULT '';

-- Migrate existing JSONB array data to HTML (convert array items to bullet list)
UPDATE job_posts
SET 
  responsibilities_html = CASE 
    WHEN responsibilities IS NOT NULL AND jsonb_array_length(responsibilities) > 0 
    THEN '<ul>' || (
      SELECT string_agg('<li>' || elem::text || '</li>', '')
      FROM jsonb_array_elements_text(responsibilities) AS elem
    ) || '</ul>'
    ELSE ''
  END,
  must_have_skills_html = CASE 
    WHEN must_have_skills IS NOT NULL AND jsonb_array_length(must_have_skills) > 0 
    THEN '<ul>' || (
      SELECT string_agg('<li>' || elem::text || '</li>', '')
      FROM jsonb_array_elements_text(must_have_skills) AS elem
    ) || '</ul>'
    ELSE ''
  END,
  preferred_skills_html = CASE 
    WHEN preferred_skills IS NOT NULL AND jsonb_array_length(preferred_skills) > 0 
    THEN '<ul>' || (
      SELECT string_agg('<li>' || elem::text || '</li>', '')
      FROM jsonb_array_elements_text(preferred_skills) AS elem
    ) || '</ul>'
    ELSE ''
  END,
  benefits_html = CASE 
    WHEN benefits IS NOT NULL AND jsonb_array_length(benefits) > 0 
    THEN '<ul>' || (
      SELECT string_agg('<li>' || elem::text || '</li>', '')
      FROM jsonb_array_elements_text(benefits) AS elem
    ) || '</ul>'
    ELSE ''
  END;

-- Drop the old JSONB columns
ALTER TABLE job_posts
  DROP COLUMN IF EXISTS responsibilities,
  DROP COLUMN IF EXISTS must_have_skills,
  DROP COLUMN IF EXISTS preferred_skills,
  DROP COLUMN IF EXISTS benefits;

-- Rename new columns to original names
ALTER TABLE job_posts
  RENAME COLUMN responsibilities_html TO responsibilities;
ALTER TABLE job_posts
  RENAME COLUMN must_have_skills_html TO must_have_skills;
ALTER TABLE job_posts
  RENAME COLUMN preferred_skills_html TO preferred_skills;
ALTER TABLE job_posts
  RENAME COLUMN benefits_html TO benefits;

-- Add comments
COMMENT ON COLUMN job_posts.responsibilities IS 'HTML content for job responsibilities (rich text from TipTap editor)';
COMMENT ON COLUMN job_posts.must_have_skills IS 'HTML content for required skills/qualifications (rich text from TipTap editor)';
COMMENT ON COLUMN job_posts.preferred_skills IS 'HTML content for preferred/nice-to-have skills (rich text from TipTap editor)';
COMMENT ON COLUMN job_posts.benefits IS 'HTML content for job benefits (rich text from TipTap editor)';

-- ============================================
-- PART 3: Fix seo_additional_schemas format
-- ============================================
-- The current format wraps schemas in {type, data} which is invalid
-- We need to store just the raw schema.org JSON-LD objects

-- Clear existing invalid schemas (they will be regenerated on next save)
UPDATE job_posts
SET seo_additional_schemas = '[]'::jsonb
WHERE seo_additional_schemas IS NOT NULL 
  AND jsonb_array_length(seo_additional_schemas) > 0
  AND (seo_additional_schemas->0)::jsonb ? 'type';

COMMENT ON COLUMN job_posts.seo_additional_schemas IS 'Array of raw Schema.org JSON-LD objects (no wrapper). Primary JobPosting schema is auto-generated on frontend.';
