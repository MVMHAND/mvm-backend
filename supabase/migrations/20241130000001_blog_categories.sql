-- Migration: Blog Categories Table
-- Description: Creates table for blog post categories with RLS and audit tracking

-- Create blog_categories table
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  post_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX idx_blog_categories_name ON public.blog_categories(name);
CREATE INDEX idx_blog_categories_created_by ON public.blog_categories(created_by);
CREATE INDEX idx_blog_categories_updated_by ON public.blog_categories(updated_by);
CREATE INDEX idx_blog_categories_created_at ON public.blog_categories(created_at);

-- Enable Row Level Security
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow authenticated users to view all categories
CREATE POLICY "Allow authenticated users to view all categories"
ON public.blog_categories FOR SELECT
TO authenticated
USING (true);

-- RLS Policy: Allow blog managers to manage categories
CREATE POLICY "Allow blog managers to manage categories"
ON public.blog_categories FOR ALL
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
CREATE TRIGGER update_blog_categories_updated_at
BEFORE UPDATE ON public.blog_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function: Set updated_by to current user (if not exists)
CREATE OR REPLACE FUNCTION public.set_updated_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Automatically set updated_by field
CREATE TRIGGER set_blog_categories_updated_by
BEFORE UPDATE ON public.blog_categories
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_by();

-- Function: Prevent deletion of categories with published posts
CREATE OR REPLACE FUNCTION public.prevent_category_deletion_if_posts()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.blog_posts 
      WHERE category_id = OLD.id AND status = 'published') > 0 THEN
    RAISE EXCEPTION 'Cannot delete category with published posts';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Check for published posts before allowing category deletion
CREATE TRIGGER check_category_deletion
BEFORE DELETE ON public.blog_categories
FOR EACH ROW
EXECUTE FUNCTION public.prevent_category_deletion_if_posts();

-- Add table comment for documentation
COMMENT ON TABLE public.blog_categories IS 'Blog post categories with audit tracking and RLS';
COMMENT ON COLUMN public.blog_categories.name IS 'Unique category name';
COMMENT ON COLUMN public.blog_categories.post_count IS 'Automatically maintained count of published posts';
COMMENT ON COLUMN public.blog_categories.created_by IS 'User who created this category';
COMMENT ON COLUMN public.blog_categories.updated_by IS 'User who last updated this category';
