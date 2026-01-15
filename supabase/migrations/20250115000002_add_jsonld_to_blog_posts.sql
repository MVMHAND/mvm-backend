-- Migration: Add seo_json_ld field for custom Schema.org structured data
-- The published_date field already exists, we're just making it editable via UI

-- Add JSON-LD field for custom structured data
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS seo_json_ld JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN blog_posts.seo_json_ld IS 'Custom Schema.org JSON-LD structured data for SEO';

-- Add index for JSON queries (for future filtering capabilities)
CREATE INDEX IF NOT EXISTS idx_blog_posts_seo_json_ld ON blog_posts USING GIN (seo_json_ld);
