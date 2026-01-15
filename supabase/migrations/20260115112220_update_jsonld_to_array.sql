-- Rename old field to keep data
ALTER TABLE blog_posts
RENAME COLUMN seo_json_ld TO seo_json_ld_old;

-- Create new field as JSONB array
ALTER TABLE blog_posts
ADD COLUMN seo_additional_schemas JSONB DEFAULT '[]'::jsonb;

-- Migrate existing data (if any custom JSON-LD exists, move to array)
UPDATE blog_posts
SET seo_additional_schemas =
    CASE
        WHEN seo_json_ld_old IS NOT NULL
        THEN jsonb_build_array(seo_json_ld_old)
        ELSE '[]'::jsonb
    END
WHERE seo_json_ld_old IS NOT NULL;

-- Drop old column after migration
ALTER TABLE blog_posts DROP COLUMN seo_json_ld_old;

-- Drop old index if exists
DROP INDEX IF EXISTS idx_blog_posts_seo_json_ld;

-- Add comment
COMMENT ON COLUMN blog_posts.seo_additional_schemas IS 'Array of additional Schema.org JSON-LD objects (FAQ, HowTo, Recipe, etc.). Article schema is auto-generated.';

-- Add constraint to ensure it is an array
ALTER TABLE blog_posts ADD CONSTRAINT seo_additional_schemas_is_array CHECK (jsonb_typeof(seo_additional_schemas) = 'array');
