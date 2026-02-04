-- Add color field to job_categories table
-- This field will store hex color codes for category chips

ALTER TABLE job_categories
ADD COLUMN color VARCHAR(7);

COMMENT ON COLUMN job_categories.color IS 'Hex color code for category chip display (e.g., #FF5733)';

-- Set default colors for existing categories
UPDATE job_categories
SET color = CASE
  WHEN name ILIKE '%technology%' OR name ILIKE '%tech%' OR name ILIKE '%engineering%' THEN '#3B82F6'
  WHEN name ILIKE '%full-time%' OR name ILIKE '%full%' THEN '#10B981'
  WHEN name ILIKE '%marketing%' THEN '#EC4899'
  WHEN name ILIKE '%design%' THEN '#8B5CF6'
  WHEN name ILIKE '%sales%' THEN '#F59E0B'
  WHEN name ILIKE '%support%' OR name ILIKE '%customer%' THEN '#06B6D4'
  ELSE '#6366F1'
END
WHERE color IS NULL;
