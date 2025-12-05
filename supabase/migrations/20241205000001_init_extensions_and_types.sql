-- ================================================
-- EXTENSIONS AND TYPES
-- ================================================
-- Initialize required PostgreSQL extensions and custom types

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User status enum
CREATE TYPE user_status AS ENUM ('invited', 'active', 'inactive', 'deleted');

-- Blog post status enum
CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');
