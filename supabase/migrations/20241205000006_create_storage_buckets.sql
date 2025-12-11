-- ================================================
-- STORAGE BUCKETS AND POLICIES
-- ================================================
-- Create storage buckets for avatars and blog images

-- ================================================
-- USER AVATARS BUCKET
-- ================================================
-- SECURITY: Private bucket with ownership-based access control
-- Users can only manage their own avatars (path: {user_id}/...)
-- Authenticated users can view all avatars (for admin panel)
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-avatars', 'user-avatars', false)
ON CONFLICT (id) DO NOTHING;

-- Users can upload their own avatar (path must match their user ID)
CREATE POLICY "Users can upload their own avatar"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'user-avatars' 
        AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    );

-- Users can update their own avatar (path must match their user ID)
CREATE POLICY "Users can update their own avatar"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'user-avatars' 
        AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    )
    WITH CHECK (
        bucket_id = 'user-avatars' 
        AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    );

-- Users can delete their own avatar (path must match their user ID)
CREATE POLICY "Users can delete their own avatar"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'user-avatars' 
        AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    );

-- Authenticated users can view all avatars (for admin panel user profiles)
CREATE POLICY "Authenticated users can view all avatars"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'user-avatars');

-- ================================================
-- BLOG COVER IMAGES BUCKET
-- ================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-cover-images', 'blog-cover-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload blog cover images
CREATE POLICY "Authenticated users can upload blog cover images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'blog-cover-images');

-- Allow authenticated users to update blog cover images
CREATE POLICY "Authenticated users can update blog cover images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'blog-cover-images');

-- Allow authenticated users to delete blog cover images
CREATE POLICY "Authenticated users can delete blog cover images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'blog-cover-images');

-- Allow public read access to blog cover images (bucket is public)
CREATE POLICY "Public read access to blog cover images"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'blog-cover-images');

-- ================================================
-- BLOG CONTRIBUTOR AVATARS BUCKET
-- ================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-contributor-avatars', 'blog-contributor-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload blog contributor avatars
CREATE POLICY "Authenticated users can upload blog contributor avatars"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'blog-contributor-avatars');

-- Allow authenticated users to update blog contributor avatars
CREATE POLICY "Authenticated users can update blog contributor avatars"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'blog-contributor-avatars');

-- Allow authenticated users to delete blog contributor avatars
CREATE POLICY "Authenticated users can delete blog contributor avatars"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'blog-contributor-avatars');

-- Allow public read access to blog contributor avatars (bucket is public)
CREATE POLICY "Public read access to blog contributor avatars"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'blog-contributor-avatars');
