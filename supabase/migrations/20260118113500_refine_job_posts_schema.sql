-- ============================================
-- Job Posts Schema Refinements
-- ============================================

-- Add experience_level enum
CREATE TYPE experience_level_enum AS ENUM (
  'entry-level',
  'junior',
  'mid-level',
  'senior',
  'lead',
  'principal',
  'executive'
);

-- Drop location_type enum and content_type enum (no longer needed)
DROP TYPE IF EXISTS location_type_enum CASCADE;
DROP TYPE IF EXISTS content_type_enum CASCADE;

-- Modify job_posts table
ALTER TABLE job_posts
  -- Remove fields
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS content,
  DROP COLUMN IF EXISTS content_type,
  DROP COLUMN IF EXISTS location_type,
  
  -- Add job_id field (auto-generated, used as slug)
  ADD COLUMN IF NOT EXISTS job_id VARCHAR(20) UNIQUE,
  
  -- Add URL fields (like blog)
  ADD COLUMN IF NOT EXISTS primary_site_url VARCHAR(500);

-- Change experience_level to enum (handle existing data)
ALTER TABLE job_posts 
  ALTER COLUMN experience_level DROP DEFAULT,
  ALTER COLUMN experience_level TYPE experience_level_enum 
    USING CASE 
      WHEN experience_level IS NULL THEN NULL
      WHEN experience_level ILIKE '%entry%' THEN 'entry-level'::experience_level_enum
      WHEN experience_level ILIKE '%junior%' THEN 'junior'::experience_level_enum
      WHEN experience_level ILIKE '%mid%' THEN 'mid-level'::experience_level_enum
      WHEN experience_level ILIKE '%senior%' THEN 'senior'::experience_level_enum
      WHEN experience_level ILIKE '%lead%' THEN 'lead'::experience_level_enum
      WHEN experience_level ILIKE '%principal%' THEN 'principal'::experience_level_enum
      WHEN experience_level ILIKE '%executive%' THEN 'executive'::experience_level_enum
      ELSE NULL
    END;

-- Generate job_id for existing posts (format: JOB-XXXXXX)
UPDATE job_posts
SET job_id = 'JOB-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')
WHERE job_id IS NULL;

-- Make job_id NOT NULL after populating
ALTER TABLE job_posts ALTER COLUMN job_id SET NOT NULL;

-- Update slug to match job_id for existing posts
UPDATE job_posts SET slug = job_id;

-- Create function to auto-generate job_id and sync slug
CREATE OR REPLACE FUNCTION generate_job_id()
RETURNS TRIGGER AS $$
DECLARE
  new_job_id VARCHAR(20);
  counter INTEGER := 0;
BEGIN
  -- Generate job_id format: JOB-XXXXXX (6 random digits)
  LOOP
    new_job_id := 'JOB-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Check if job_id exists
    IF NOT EXISTS (SELECT 1 FROM job_posts WHERE job_id = new_job_id) THEN
      EXIT;
    END IF;
    
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

-- Trigger to auto-generate job_id on insert
DROP TRIGGER IF EXISTS generate_job_id_trigger ON job_posts;
CREATE TRIGGER generate_job_id_trigger
  BEFORE INSERT ON job_posts
  FOR EACH ROW
  WHEN (NEW.job_id IS NULL)
  EXECUTE FUNCTION generate_job_id();

-- Trigger to keep slug in sync with job_id
CREATE OR REPLACE FUNCTION sync_job_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Always keep slug same as job_id
  NEW.slug := NEW.job_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_job_slug_trigger ON job_posts;
CREATE TRIGGER sync_job_slug_trigger
  BEFORE UPDATE ON job_posts
  FOR EACH ROW
  WHEN (OLD.job_id IS DISTINCT FROM NEW.job_id)
  EXECUTE FUNCTION sync_job_slug();

-- Update indexes
DROP INDEX IF EXISTS idx_job_posts_slug;
CREATE INDEX idx_job_posts_job_id ON job_posts(job_id);
CREATE INDEX idx_job_posts_slug_new ON job_posts(slug); -- Keep for backward compatibility

-- Update primary_site_url for existing posts
UPDATE job_posts
SET primary_site_url = 'https://myvirtualmate.com/careers/' || job_id
WHERE primary_site_url IS NULL;

-- Add comments
COMMENT ON COLUMN job_posts.job_id IS 'Auto-generated unique job identifier (e.g., JOB-123456)';
COMMENT ON COLUMN job_posts.slug IS 'URL slug, always same as job_id';
COMMENT ON COLUMN job_posts.primary_site_url IS 'Full URL to job post on main website';
COMMENT ON COLUMN job_posts.experience_level IS 'Required experience level for the position';
