-- ============================================
-- Job Posts Module - Database Schema
-- ============================================

-- Enums
CREATE TYPE job_status AS ENUM ('draft', 'published', 'unpublished');
CREATE TYPE employment_type_enum AS ENUM ('full-time', 'part-time', 'contract', 'project-based', 'freelance', 'internship');
CREATE TYPE location_type_enum AS ENUM ('remote', 'hybrid', 'onsite');

-- ============================================
-- Job Categories Table
-- ============================================
CREATE TABLE job_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Job Posts Table
-- ============================================
CREATE TABLE job_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,

  -- Content
  description TEXT, -- Short summary
  overview TEXT, -- Position overview
  content TEXT, -- Full job description
  content_type content_type_enum DEFAULT 'html',
  cover_image_url TEXT,

  -- Job Details
  category_id UUID REFERENCES job_categories(id) ON DELETE SET NULL,
  department VARCHAR(100),
  location VARCHAR(255),
  location_type location_type_enum,
  employment_type employment_type_enum NOT NULL,

  -- Salary (flexible: structured OR custom text)
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency VARCHAR(3) DEFAULT 'AUD',
  salary_period VARCHAR(20) DEFAULT 'hourly',
  salary_custom_text TEXT,

  -- Content Arrays (stored as JSONB)
  responsibilities JSONB DEFAULT '[]'::jsonb,
  requirements JSONB DEFAULT '[]'::jsonb,
  preferred_skills JSONB DEFAULT '[]'::jsonb,
  benefits JSONB DEFAULT '[]'::jsonb,
  skills JSONB DEFAULT '[]'::jsonb,
  application_process TEXT,

  -- Metadata
  experience_level VARCHAR(50),
  status job_status DEFAULT 'published',
  published_at TIMESTAMPTZ,
  custom_posted_date TIMESTAMPTZ,

  -- SEO (auto-generated if not provided)
  seo_meta_title VARCHAR(60),
  seo_meta_description VARCHAR(160),
  seo_additional_schemas JSONB DEFAULT '[]'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- ============================================
-- Triggers
-- ============================================

-- Update updated_at timestamp
CREATE TRIGGER update_job_posts_updated_at
  BEFORE UPDATE ON job_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_categories_updated_at
  BEFORE UPDATE ON job_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-set published_at on publish
CREATE OR REPLACE FUNCTION set_job_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') AND NEW.published_at IS NULL THEN
    NEW.published_at = NOW();
  ELSIF NEW.status != 'published' THEN
    NEW.published_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_published_at_trigger
  BEFORE INSERT OR UPDATE ON job_posts
  FOR EACH ROW EXECUTE FUNCTION set_job_published_at();

-- Update category post count
CREATE OR REPLACE FUNCTION update_job_category_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'published' AND NEW.category_id IS NOT NULL THEN
      UPDATE job_categories SET post_count = post_count + 1 WHERE id = NEW.category_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.category_id IS DISTINCT FROM NEW.category_id THEN
      IF OLD.category_id IS NOT NULL AND OLD.status = 'published' THEN
        UPDATE job_categories SET post_count = post_count - 1 WHERE id = OLD.category_id;
      END IF;
      IF NEW.category_id IS NOT NULL AND NEW.status = 'published' THEN
        UPDATE job_categories SET post_count = post_count + 1 WHERE id = NEW.category_id;
      END IF;
    ELSIF OLD.status IS DISTINCT FROM NEW.status AND NEW.category_id IS NOT NULL THEN
      IF OLD.status != 'published' AND NEW.status = 'published' THEN
        UPDATE job_categories SET post_count = post_count + 1 WHERE id = NEW.category_id;
      ELSIF OLD.status = 'published' AND NEW.status != 'published' THEN
        UPDATE job_categories SET post_count = post_count - 1 WHERE id = NEW.category_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'published' AND OLD.category_id IS NOT NULL THEN
      UPDATE job_categories SET post_count = post_count - 1 WHERE id = OLD.category_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_category_post_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON job_posts
  FOR EACH ROW EXECUTE FUNCTION update_job_category_post_count();

-- ============================================
-- RLS Policies (following blog pattern)
-- ============================================

ALTER TABLE job_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_posts ENABLE ROW LEVEL SECURITY;

-- Job Categories Policies
CREATE POLICY "Allow authenticated users to read job categories"
  ON job_categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to manage job categories"
  ON job_categories FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow service role full access to job categories"
  ON job_categories FOR ALL TO service_role USING (true);

-- Job Posts Policies
CREATE POLICY "Allow authenticated users to read job posts"
  ON job_posts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert job posts"
  ON job_posts FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update job posts"
  ON job_posts FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete job posts"
  ON job_posts FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow service role full access to job posts"
  ON job_posts FOR ALL TO service_role USING (true);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX idx_job_posts_slug ON job_posts(slug);
CREATE INDEX idx_job_posts_status ON job_posts(status);
CREATE INDEX idx_job_posts_category ON job_posts(category_id);
CREATE INDEX idx_job_posts_published_at ON job_posts(published_at DESC NULLS LAST);
CREATE INDEX idx_job_posts_custom_posted_date ON job_posts(custom_posted_date DESC NULLS LAST);
CREATE INDEX idx_job_posts_employment_type ON job_posts(employment_type);
CREATE INDEX idx_job_categories_slug ON job_categories(slug);

-- ============================================
-- Permissions Sync
-- ============================================

INSERT INTO user_permissions (permission_key, label, description, "group") VALUES
  ('job-posts.view', 'View Job Posts', 'View job posts and categories', 'Job Posts'),
  ('job-posts.edit', 'Edit Job Posts', 'Create and edit job posts', 'Job Posts'),
  ('job-posts.publish', 'Publish Job Posts', 'Publish and unpublish job posts', 'Job Posts'),
  ('job-posts.delete', 'Delete Job Posts', 'Delete job posts', 'Job Posts')
ON CONFLICT (permission_key) DO NOTHING;

-- Assign permissions to Admin role
INSERT INTO user_role_permissions (role_id, permission_key)
SELECT r.id, p.key
FROM user_roles r
CROSS JOIN (VALUES
  ('job-posts.view'),
  ('job-posts.edit'),
  ('job-posts.publish'),
  ('job-posts.delete')
) AS p(key)
WHERE r.name = 'Admin'
ON CONFLICT DO NOTHING;

-- Assign view permission to Manager role
INSERT INTO user_role_permissions (role_id, permission_key)
SELECT id, 'job-posts.view' FROM user_roles WHERE name = 'Manager'
ON CONFLICT DO NOTHING;
