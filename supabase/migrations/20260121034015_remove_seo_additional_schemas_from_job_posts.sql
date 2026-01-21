-- Remove seo_additional_schemas column from job_posts table
-- This column is no longer used; schemas are auto-generated at runtime

ALTER TABLE public.job_posts DROP COLUMN IF EXISTS seo_additional_schemas;
