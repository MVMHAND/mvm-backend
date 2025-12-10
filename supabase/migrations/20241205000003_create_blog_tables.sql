-- ================================================
-- BLOG MANAGEMENT TABLES
-- ================================================
-- Tables for blog: categories, contributors, posts

-- ================================================
-- BLOG CATEGORIES TABLE
-- ================================================
CREATE TABLE blog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    post_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_blog_categories_name ON blog_categories(name);

COMMENT ON TABLE blog_categories IS 'Blog post categories';

-- ================================================
-- BLOG CONTRIBUTORS TABLE
-- ================================================
CREATE TABLE blog_contributors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    position TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT NOT NULL,
    expertise TEXT[] NOT NULL DEFAULT '{}',
    stats TEXT[] NOT NULL DEFAULT '{}',
    post_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_blog_contributors_full_name ON blog_contributors(full_name);

COMMENT ON TABLE blog_contributors IS 'Blog post authors/contributors';

-- ================================================
-- BLOG POSTS TABLE
-- ================================================
CREATE TABLE blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seo_meta_title TEXT DEFAULT '',
    seo_meta_description TEXT DEFAULT '',
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    cover_image_url TEXT,
    category_id UUID REFERENCES blog_categories(id) ON DELETE RESTRICT,
    contributor_id UUID REFERENCES blog_contributors(id) ON DELETE RESTRICT,
    content TEXT DEFAULT '',
    reading_time INTEGER NOT NULL,
    published_date TIMESTAMPTZ,
    status post_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    published_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_category_id ON blog_posts(category_id);
CREATE INDEX idx_blog_posts_contributor_id ON blog_posts(contributor_id);
CREATE INDEX idx_blog_posts_published_date ON blog_posts(published_date DESC);

COMMENT ON TABLE blog_posts IS 'Blog posts with full content and metadata';
