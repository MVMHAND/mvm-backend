-- Add audit fields to job_categories table to match other tables
ALTER TABLE job_categories
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_categories_created_by ON job_categories(created_by);
CREATE INDEX IF NOT EXISTS idx_job_categories_updated_by ON job_categories(updated_by);

-- Add comments for documentation
COMMENT ON COLUMN job_categories.created_by IS 'User who created this category';
COMMENT ON COLUMN job_categories.updated_by IS 'User who last updated this category';
