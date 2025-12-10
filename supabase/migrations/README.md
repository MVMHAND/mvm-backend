# Database Migrations

This directory contains clean, efficient Supabase migrations organized by domain.

## Migration Structure

### 1. `20241205000001_init_extensions_and_types.sql`
- PostgreSQL extensions (pgcrypto)
- Custom types (user_status, post_status)

### 2. `20241205000002_create_user_tables.sql`
**User Management Tables:**
- `user_roles` - RBAC roles with super admin support
- `users` - User profiles linked to auth.users
- `user_permissions` - System permissions
- `user_role_permissions` - Role-permission junction table
- `user_audit_logs` - Audit trail for all actions
- `user_invitations` - User invitation tokens (7-day expiry)
- `user_password_reset_tokens` - Password reset tokens (30-min expiry)

### 3. `20241205000003_create_blog_tables.sql`
**Blog Management Tables:**
- `blog_categories` - Blog post categories (name, post_count, created_by, updated_by)
- `blog_contributors` - Blog authors/contributors (full_name, position, bio, expertise, stats, post_count, created_by, updated_by)
- `blog_posts` - Blog posts with SEO metadata (seo_meta_title, seo_meta_description, title, slug, cover_image_url, category_id, contributor_id, content, reading_time, published_date, status, created_by, updated_by, published_by)

### 4. `20241205000004_create_functions_and_triggers.sql`
**Reusable Functions:**
- `update_updated_at_column()` - Auto-update timestamps
- `prevent_super_admin_modification()` - Protect super admin role
- `prevent_super_admin_user_modification()` - Protect super admin user

**Triggers:**
- Auto-update `updated_at` on all tables
- Prevent super admin role/user modification

### 5. `20241205000005_enable_rls_policies.sql`
**Row Level Security:**
- Enable RLS on all tables
- Policies for authenticated users
- Policies for public access (blog content)
- Service role policies for admin operations

### 6. `20241205000006_create_storage_buckets.sql`
**Storage Buckets:**
- `user-avatars` - User profile avatars (public)
- `blog-cover-images` - Blog post cover images (public)
- `blog-contributor-avatars` - Blog contributor avatars (public)

### 7. `20241205000007_seed_initial_data.sql`
**Initial Data:**
- Default roles (Super Admin, Admin, Manager, Support)
- System permissions
- Role-permission assignments

## Key Features

### ✅ Efficient Design
- No redundant table renames
- Organized by domain (user, blog)
- Single migration per concern
- All tables use `user_` prefix from the start

### ✅ Super Admin Protection
- Exactly one super admin role (enforced by unique index)
- Cannot modify or delete super admin role
- Cannot modify or delete super admin user
- Super admin bypasses permission checks

### ✅ Complete RBAC
- Role-based access control
- Permission system
- Audit logging
- User invitations with secure tokens

### ✅ Blog System
- Categories with colors
- Contributors with social links
- Posts with SEO metadata
- Draft/Published/Unpublished status

## Running Migrations

```bash
# Reset and apply all migrations
npx supabase db reset

# Apply new migrations only
npx supabase db push
```

## Adding New Migrations

When adding new migrations, follow this naming pattern:
```
YYYYMMDDHHMMSS_descriptive_name.sql
```

Example:
```
20241206120000_add_user_settings_table.sql
```

## Notes

- All user-related tables use `user_` prefix
- All blog-related tables use `blog_` prefix
- Storage buckets use kebab-case naming
- RLS is enabled on all tables
- Service role has full access for admin operations
