-- Add published_by column to job_posts table
ALTER TABLE job_posts
ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_job_posts_published_by ON job_posts(published_by);

-- Add comment for documentation
COMMENT ON COLUMN job_posts.published_by IS 'User who published this job post';

-- Update the trigger to clear published_by when unpublishing
CREATE OR REPLACE FUNCTION set_job_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') AND NEW.published_at IS NULL THEN
    NEW.published_at = NOW();
  ELSIF NEW.status != 'published' THEN
    NEW.published_at = NULL;
    NEW.published_by = NULL;  -- Clear publisher when unpublishing
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
