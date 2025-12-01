-- Migration: Blog Posts Table and Storage
-- Description: Creates blog posts table, storage buckets, and all related triggers

-- Create storage bucket for blog cover images
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-covers', 'blog-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for contributor avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('contributor-avatars', 'contributor-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Allow authenticated users to upload blog covers
CREATE POLICY "Allow authenticated users to upload blog covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'blog-covers');

-- Storage Policy: Allow authenticated users to update blog covers
CREATE POLICY "Allow authenticated users to update blog covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'blog-covers');

-- Storage Policy: Allow public to view blog covers
CREATE POLICY "Allow public to view blog covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'blog-covers');

-- Storage Policy: Allow authenticated users to delete blog covers
CREATE POLICY "Allow authenticated users to delete blog covers"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'blog-covers');

-- Storage Policy: Allow authenticated users to upload contributor avatars
CREATE POLICY "Allow authenticated users to upload contributor avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'contributor-avatars');

-- Storage Policy: Allow authenticated users to update contributor avatars
CREATE POLICY "Allow authenticated users to update contributor avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'contributor-avatars');

-- Storage Policy: Allow public to view contributor avatars
CREATE POLICY "Allow public to view contributor avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'contributor-avatars');

-- Storage Policy: Allow authenticated users to delete contributor avatars
CREATE POLICY "Allow authenticated users to delete contributor avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'contributor-avatars');

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seo_meta_title TEXT NOT NULL,
  seo_meta_description TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  cover_image_url TEXT,
  category_id UUID NOT NULL REFERENCES public.blog_categories(id) ON DELETE RESTRICT,
  contributor_id UUID NOT NULL REFERENCES public.blog_contributors(id) ON DELETE RESTRICT,
  content TEXT NOT NULL,
  reading_time INTEGER NOT NULL,
  published_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'unpublished')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT seo_meta_title_length CHECK (char_length(seo_meta_title) <= 60),
  CONSTRAINT seo_meta_description_length CHECK (char_length(seo_meta_description) <= 160)
);

-- Create indexes for performance
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_category ON public.blog_posts(category_id);
CREATE INDEX idx_blog_posts_contributor ON public.blog_posts(contributor_id);
CREATE INDEX idx_blog_posts_published_date ON public.blog_posts(published_date DESC);
CREATE INDEX idx_blog_posts_created_by ON public.blog_posts(created_by);
CREATE INDEX idx_blog_posts_updated_by ON public.blog_posts(updated_by);
CREATE INDEX idx_blog_posts_created_at ON public.blog_posts(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow authenticated users to view published posts or all if blog manager
CREATE POLICY "Allow authenticated users to view posts"
ON public.blog_posts FOR SELECT
TO authenticated
USING (
  status = 'published' OR 
  auth.uid() IN (
    SELECT p.id FROM public.profiles p
    WHERE p.role_id IN (
      SELECT rp.role_id FROM public.role_permissions rp
      WHERE rp.permission_key = 'blog.manage'
    )
  )
);

-- RLS Policy: Allow blog managers to manage all posts
CREATE POLICY "Allow blog managers to manage posts"
ON public.blog_posts FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT p.id FROM public.profiles p
    WHERE p.role_id IN (
      SELECT rp.role_id FROM public.role_permissions rp
      WHERE rp.permission_key = 'blog.manage'
    )
  )
);

-- Trigger: Automatically update updated_at timestamp
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Automatically set updated_by field
CREATE TRIGGER set_blog_posts_updated_by
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_by();

-- Function: Update category post count when posts change
CREATE OR REPLACE FUNCTION public.update_category_post_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT
  IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN
    UPDATE public.blog_categories SET post_count = post_count + 1 WHERE id = NEW.category_id;
  
  -- Handle UPDATE
  ELSIF TG_OP = 'UPDATE' THEN
    -- Status change: draft/unpublished -> published
    IF OLD.status != 'published' AND NEW.status = 'published' THEN
      UPDATE public.blog_categories SET post_count = post_count + 1 WHERE id = NEW.category_id;
    
    -- Status change: published -> draft/unpublished
    ELSIF OLD.status = 'published' AND NEW.status != 'published' THEN
      UPDATE public.blog_categories SET post_count = post_count - 1 WHERE id = OLD.category_id;
    END IF;
    
    -- Category change
    IF OLD.category_id != NEW.category_id THEN
      IF OLD.status = 'published' THEN
        UPDATE public.blog_categories SET post_count = post_count - 1 WHERE id = OLD.category_id;
      END IF;
      IF NEW.status = 'published' THEN
        UPDATE public.blog_categories SET post_count = post_count + 1 WHERE id = NEW.category_id;
      END IF;
    END IF;
  
  -- Handle DELETE
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'published' THEN
    UPDATE public.blog_categories SET post_count = post_count - 1 WHERE id = OLD.category_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update category post count on post changes
CREATE TRIGGER update_category_count_on_post_change
AFTER INSERT OR UPDATE OR DELETE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_category_post_count();

-- Function: Update contributor post count when posts change
CREATE OR REPLACE FUNCTION public.update_contributor_post_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT
  IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN
    UPDATE public.blog_contributors SET post_count = post_count + 1 WHERE id = NEW.contributor_id;
  
  -- Handle UPDATE
  ELSIF TG_OP = 'UPDATE' THEN
    -- Status change: draft/unpublished -> published
    IF OLD.status != 'published' AND NEW.status = 'published' THEN
      UPDATE public.blog_contributors SET post_count = post_count + 1 WHERE id = NEW.contributor_id;
    
    -- Status change: published -> draft/unpublished
    ELSIF OLD.status = 'published' AND NEW.status != 'published' THEN
      UPDATE public.blog_contributors SET post_count = post_count - 1 WHERE id = OLD.contributor_id;
    END IF;
    
    -- Contributor change
    IF OLD.contributor_id != NEW.contributor_id THEN
      IF OLD.status = 'published' THEN
        UPDATE public.blog_contributors SET post_count = post_count - 1 WHERE id = OLD.contributor_id;
      END IF;
      IF NEW.status = 'published' THEN
        UPDATE public.blog_contributors SET post_count = post_count + 1 WHERE id = NEW.contributor_id;
      END IF;
    END IF;
  
  -- Handle DELETE
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'published' THEN
    UPDATE public.blog_contributors SET post_count = post_count - 1 WHERE id = OLD.contributor_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update contributor post count on post changes
CREATE TRIGGER update_contributor_count_on_post_change
AFTER INSERT OR UPDATE OR DELETE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_contributor_post_count();

-- Function: Prevent deletion of published posts
CREATE OR REPLACE FUNCTION public.prevent_published_post_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'published' THEN
    RAISE EXCEPTION 'Cannot delete published posts. Unpublish first.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Check status before allowing post deletion
CREATE TRIGGER check_published_post_deletion
BEFORE DELETE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.prevent_published_post_deletion();

-- Add table comments for documentation
COMMENT ON TABLE public.blog_posts IS 'Blog posts with SEO metadata, status management, and audit tracking';
COMMENT ON COLUMN public.blog_posts.seo_meta_title IS 'SEO title (max 60 characters)';
COMMENT ON COLUMN public.blog_posts.seo_meta_description IS 'SEO meta description (max 160 characters)';
COMMENT ON COLUMN public.blog_posts.slug IS 'URL-friendly unique identifier';
COMMENT ON COLUMN public.blog_posts.cover_image_url IS 'Public URL from Supabase Storage';
COMMENT ON COLUMN public.blog_posts.reading_time IS 'Estimated reading time in minutes';
COMMENT ON COLUMN public.blog_posts.status IS 'Post status: draft, published, or unpublished';
COMMENT ON COLUMN public.blog_posts.published_date IS 'Timestamp when post was first published';
COMMENT ON COLUMN public.blog_posts.published_by IS 'User who published the post';
