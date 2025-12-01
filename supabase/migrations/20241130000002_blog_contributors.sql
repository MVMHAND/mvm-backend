-- Migration: Blog Contributors Table
-- Description: Creates table for blog post contributors/authors with RLS and avatar storage

-- Create blog_contributors table
CREATE TABLE IF NOT EXISTS public.blog_contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  position TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT NOT NULL,
  expertise TEXT[] DEFAULT '{}' NOT NULL,
  stats TEXT[] DEFAULT '{}' NOT NULL,
  post_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT expertise_max_3 CHECK (array_length(expertise, 1) IS NULL OR array_length(expertise, 1) <= 3),
  CONSTRAINT stats_max_3 CHECK (array_length(stats, 1) IS NULL OR array_length(stats, 1) <= 3)
);

-- Create indexes for performance
CREATE INDEX idx_blog_contributors_full_name ON public.blog_contributors(full_name);
CREATE INDEX idx_blog_contributors_created_by ON public.blog_contributors(created_by);
CREATE INDEX idx_blog_contributors_updated_by ON public.blog_contributors(updated_by);
CREATE INDEX idx_blog_contributors_created_at ON public.blog_contributors(created_at);

-- Enable Row Level Security
ALTER TABLE public.blog_contributors ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow authenticated users to view all contributors
CREATE POLICY "Allow authenticated users to view all contributors"
ON public.blog_contributors FOR SELECT
TO authenticated
USING (true);

-- RLS Policy: Allow blog managers to manage contributors
CREATE POLICY "Allow blog managers to manage contributors"
ON public.blog_contributors FOR ALL
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
CREATE TRIGGER update_blog_contributors_updated_at
BEFORE UPDATE ON public.blog_contributors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Automatically set updated_by field
CREATE TRIGGER set_blog_contributors_updated_by
BEFORE UPDATE ON public.blog_contributors
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_by();

-- Function: Prevent deletion of contributors with published posts
CREATE OR REPLACE FUNCTION public.prevent_contributor_deletion_if_posts()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.blog_posts 
      WHERE contributor_id = OLD.id AND status = 'published') > 0 THEN
    RAISE EXCEPTION 'Cannot delete contributor with published posts';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Check for published posts before allowing contributor deletion
CREATE TRIGGER check_contributor_deletion
BEFORE DELETE ON public.blog_contributors
FOR EACH ROW
EXECUTE FUNCTION public.prevent_contributor_deletion_if_posts();

-- Add table comments for documentation
COMMENT ON TABLE public.blog_contributors IS 'Blog post contributors/authors with avatar support';
COMMENT ON COLUMN public.blog_contributors.full_name IS 'Full name of the contributor';
COMMENT ON COLUMN public.blog_contributors.position IS 'Job title or position';
COMMENT ON COLUMN public.blog_contributors.avatar_url IS 'Public URL from Supabase Storage';
COMMENT ON COLUMN public.blog_contributors.bio IS 'Rich text biography';
COMMENT ON COLUMN public.blog_contributors.expertise IS 'Array of expertise areas (max 3)';
COMMENT ON COLUMN public.blog_contributors.stats IS 'Array of stat items (max 3)';
COMMENT ON COLUMN public.blog_contributors.post_count IS 'Automatically maintained count of published posts';
