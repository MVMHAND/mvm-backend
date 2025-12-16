# Production Deployment Guide

Complete guide for deploying My Virtual Mate admin panel to Vercel with Supabase.

---

## 📋 Table of Contents

1. [Secrets & Configuration Setup](#secrets--configuration-setup)
2. [One-Time Setup Steps](#one-time-setup-steps)
3. [Deployment Process](#deployment-process)
4. [Rollback Instructions](#rollback-instructions)
5. [Troubleshooting](#troubleshooting)

---

## 🔐 Secrets & Configuration Setup

### Required Secrets Table

| Secret Name                     | Storage Location | How to Obtain                                                      | Example Format                  | Required |
| ------------------------------- | ---------------- | ------------------------------------------------------------------ | ------------------------------- | -------- |
| `VERCEL_TOKEN`                  | GitHub Secrets   | Vercel Dashboard → Settings → Tokens → Create Token                | `abc123def456...` (72 chars)    | ✅ Yes   |
| `VERCEL_ORG_ID`                 | GitHub Secrets   | Run `vercel link` locally, copy from `.vercel/project.json`        | `team_abc123def456`             | ✅ Yes   |
| `VERCEL_PROJECT_ID`             | GitHub Secrets   | Run `vercel link` locally, copy from `.vercel/project.json`        | `prj_abc123def456`              | ✅ Yes   |
| `SUPABASE_ACCESS_TOKEN`         | GitHub Secrets   | Supabase Dashboard → Account → Access Tokens → Generate New Token  | `sbp_abc123...`                 | ✅ Yes   |
| `SUPABASE_PROJECT_ID`           | GitHub Secrets   | Supabase Dashboard → Project Settings → General → Project ID       | `abcdefghijklmnop` (16 chars)   | ✅ Yes   |
| `SUPABASE_DB_PASSWORD`          | GitHub Secrets   | Supabase Dashboard → Project Settings → Database → Password        | Your database password          | ✅ Yes   |
| `NEXT_PUBLIC_SUPABASE_URL`      | GitHub Secrets   | Supabase Dashboard → Project Settings → API → Project URL          | `https://abcdefg.supabase.co`   | ✅ Yes   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | GitHub Secrets   | Supabase Dashboard → Project Settings → API Keys → Publishable key | `eyJhbGc...` (long JWT)         | ✅ Yes   |
| `MAIN_SITE_URL`                 | GitHub Secrets   | Your public main site domain(s)                                    | `["https://myvirtualmate.com"]` | ✅ Yes   |
| `RESEND_API_KEY`                | GitHub Secrets   | Resend Dashboard → API Keys                                        | `re_abc123...`                  | ✅ Yes   |

### Environment Variables for Vercel

These should be set in **Vercel Dashboard** → Your Project → Settings → Environment Variables:

| Variable Name                   | Environment | Value Source                                | Notes                             |
| ------------------------------- | ----------- | ------------------------------------------- | --------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Production  | From Supabase Dashboard                     | Must match GitHub secret          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production  | From Supabase Dashboard                     | Must match GitHub secret          |
| `SUPABASE_SERVICE_ROLE_KEY`     | Production  | Supabase Dashboard → API Keys → Secret key  | ⚠️ Keep secret, server-only       |
| `RESEND_API_KEY`                | Production  | Resend Dashboard → API Keys                 | For email functionality           |
| `NEXT_PUBLIC_SITE_URL`          | Production  | Your production domain                      | `https://admin.myvirtualmate.com` |
| `MAIN_SITE_URL`                 | Production  | Your public main site domain(s)             | String URL or JSON array string   |
| `BLOG_PREVIEW_URL`              | Production  | `https://preview--mvm-official.lovable.app` | Blog preview URL                  |

`MAIN_SITE_URL` is required at build/runtime by `src/app/blog/[slug]/page.tsx`.

Accepted formats:

- `["https://myvirtualmate.com"]`
- `["https://myvirtualmate.com", "https://myvirtualmate.com.au"]`

---

## 🚀 One-Time Setup Steps

### Step 1: Install Vercel CLI Locally

```bash
npm install -g vercel@latest
```

### Step 2: Link Your Project to Vercel

```bash
# Navigate to project root
cd path/to/your/project

# Login to Vercel
vercel login

# Link project (follow prompts)
vercel link

# When prompted:
# ? Set up "~/path/to/project"? yes
# ? Which scope should contain your project? [Your account/team]
# ? Link to existing project? no
# ? What's your project's name? [your-project-name]
# ? In which directory is your code located? ./
# ? Want to modify these settings? no
# ? Do you want to change additional project settings? no
# ? Detected a repository. Connect it to this project? no

# This creates .vercel/project.json with ORG_ID and PROJECT_ID
```

### Step 3: Extract Vercel IDs

```bash
# Windows PowerShell
Get-Content .vercel\project.json

# Look for:
# "orgId": "team_abc123..." → This is VERCEL_ORG_ID
# "projectId": "prj_abc123..." → This is VERCEL_PROJECT_ID
```

### Step 4: Generate Vercel Token

1. Go to https://vercel.com/account/tokens
2. Click **Create Token**
3. Name: `GitHub Actions Production`
4. Scope: Select your team/account
5. Expiration: No expiration (or set to 1 year)
6. Click **Create**
7. Copy the token immediately (shown only once)

### Step 5: Create Supabase Project

**If you don't have a Supabase project yet:**

1. Go to https://supabase.com/dashboard
2. Click **New Project**
3. Choose your organization/team
4. Enter project name (e.g., `mvm-backend`)
5. Set database password (save it securely)
6. Choose region closest to your users
7. Click **Create Project**
8. Wait for project setup (2-3 minutes)

### Step 6: Get Supabase Credentials

**Access Token:**

1. Go to https://supabase.com/dashboard/account/tokens
2. Click **Generate New Token**
3. Name: `GitHub Actions CI/CD`
4. Click **Generate Token**
5. Copy the token (starts with `sbp_`)

**Project ID:**

1. Open your Supabase project
2. Go to **Project Settings** → **General**
3. Copy **Project ID**

**Database Password:**

1. Go to **Project Settings** → **Database**
2. Use your existing database password
3. If forgotten, reset it (⚠️ will require updating all connections)

**API Credentials:**

1. Go to **Project Settings** → **Data API**
2. Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
3. Go to **Project Settings** → **API Keys**
4. Copy **Publishable** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Copy **Secret** key → `SUPABASE_SERVICE_ROLE_KEY` (for Vercel only)

### Step 8: Add Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret from the table above
5. Verify all 9 secrets are added

### Step 9: Configure Vercel Environment Variables

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable from the "Environment Variables for Vercel" table
5. Set environment to **Production**
6. Click **Save**

### Step 10: Verify Supabase Migrations

```bash
# Install Supabase CLI locally
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Verify migrations are in sync
supabase db diff

# If there are pending migrations, they'll be applied on first deployment
```

### Step 11: Test Workflow (Optional)

Create a test commit to verify setup:

```bash
git checkout -b test-deployment
echo "# Test" >> README.md
git add README.md
git commit -m "test: verify deployment pipeline"
git push origin test-deployment

# Merge to main via PR to trigger deployment
```

---

## 📦 Deployment Process

### How Deployments Are Triggered

Deployments run **automatically** when:

- Code is pushed directly to `main` branch
- A pull request is merged into `main` branch

### Deployment Phases

The workflow runs in **4 sequential phases**:

#### Phase 1: Build Validation (2-4 minutes)

- ✅ Install dependencies with caching
- ✅ Run ESLint checks
- ✅ Run TypeScript type checking
- ✅ Run Prettier format validation
- ✅ Build Next.js application

**If this fails:** Deployment stops immediately. No database or Vercel changes are made.

#### Phase 2: Database Migration (1-2 minutes)

- ✅ Link to Supabase project
- ✅ Apply all pending migrations from `supabase/migrations/`
- ✅ Log migration results
- ✅ Upload migration logs as artifact

**If this fails:** Deployment stops. Edge Functions and Vercel deployment are NOT triggered. Database may be partially migrated (see rollback section).

#### Phase 3: Edge Functions Deployment (1-2 minutes)

- ✅ Link to Supabase project
- ✅ Deploy all Edge Functions
- ✅ Log deployment results
- ✅ Upload deployment logs as artifact

**If this fails:** Deployment stops. Vercel deployment is NOT triggered. Database migrations are already applied.

#### Phase 4: Vercel Deployment (3-5 minutes)

- ✅ Pull Vercel environment configuration
- ✅ Build production artifacts
- ✅ Deploy to Vercel production
- ✅ Post deployment URL as commit comment
- ✅ Upload deployment logs

**If this fails:** Database migrations and Edge Functions are already deployed. You'll need to rollback manually (see below).

### Monitoring a Deployment

1. Go to **Actions** tab in GitHub repository
2. Click on the running workflow
3. Watch each phase complete in real-time
4. Check logs for any warnings or errors

### Verifying Deployment Success

After workflow completes:

1. **Check GitHub Actions:**
   - All jobs should show green checkmarks ✅
   - Deployment URL posted as commit comment

2. **Check Vercel Dashboard:**
   - Go to https://vercel.com/dashboard
   - Verify deployment status is "Ready"
   - Note the deployment URL

3. **Test the Application:**

   ```bash
   # Visit production URL
   https://your-project.vercel.app/admin/login

   # Verify:
   - Login page loads
   - Can authenticate
   - Database queries work
   - No console errors
   ```

4. **Check Supabase:**
   - Go to Supabase Dashboard → Database → Migrations
   - Verify latest migrations are applied
   - Check timestamp matches deployment time
   - Go to Supabase Dashboard → Edge Functions
   - Verify all Edge Functions are deployed
   - Check deployment timestamp matches workflow time

---

## 🔄 Rollback Instructions

### When to Rollback

Rollback if:

- ❌ Application crashes or shows errors in production
- ❌ Database queries fail
- ❌ Critical features are broken
- ❌ Security vulnerability introduced

### Rollback Strategy

#### Option A: Rollback Vercel Deployment (Recommended for Frontend Issues)

**Via Vercel Dashboard (Fastest):**

1. Go to https://vercel.com/dashboard
2. Select your project
3. Click **Deployments** tab
4. Find the last working deployment (marked with ✅)
5. Click the **three dots** (⋯) menu
6. Select **Promote to Production**
7. Confirm the rollback

**Time to rollback:** ~30 seconds

**Via Vercel CLI:**

```bash
# List recent deployments
vercel ls

# Find the deployment URL of the last working version
# Example: my-app-abc123.vercel.app

# Promote it to production
vercel promote my-app-abc123.vercel.app --token=YOUR_VERCEL_TOKEN
```

**What this does:**

- ✅ Instantly switches production traffic to previous deployment
- ✅ No rebuild required
- ✅ Database remains at current migration state
- ⚠️ If database schema changed, you may need to rollback DB too

#### Option B: Rollback Database Migrations (For Database Issues)

**⚠️ WARNING:** Database rollbacks are risky. Always backup first.

**Method 1: Using Supabase Point-in-Time Recovery (Recommended)**

1. Go to Supabase Dashboard → **Database** → **Backups**
2. Find a backup from before the problematic deployment
3. Click **Restore** on that backup
4. Confirm restoration (⚠️ this will overwrite current data)
5. Wait for restoration to complete (5-15 minutes)
6. Verify database state

**Method 2: Manual Down-Migration (If Available)**

If you created down-migration scripts:

```bash
# Connect to your project
supabase link --project-ref YOUR_PROJECT_REF

# List applied migrations
supabase migration list

# Create a new migration that reverses changes
# Example: If migration 20241215_add_column.sql added a column
supabase migration new rollback_20241215_add_column

# Edit the new migration file to reverse changes
# Then apply it
supabase db push
```

**Method 3: Manual SQL Rollback**

1. Go to Supabase Dashboard → **SQL Editor**
2. Write SQL to undo the migration changes:

   ```sql
   -- Example: Remove a column that was added
   ALTER TABLE users DROP COLUMN IF EXISTS new_column;

   -- Example: Restore a dropped table from backup
   -- (requires having a backup)
   ```

3. Execute the SQL
4. Verify changes

**After Database Rollback:**

- You MUST also rollback the Vercel deployment to match the database schema
- Test thoroughly to ensure data integrity

#### Option C: Emergency Full Rollback (Both Frontend + Database)

**Use this when both frontend and database need to be reverted:**

1. **First, rollback Vercel** (see Option A)
2. **Then, rollback Database** (see Option B, Method 1)
3. **Verify both are in sync:**

   ```bash
   # Check Vercel deployment
   curl https://your-app.vercel.app/api/health

   # Check database
   # Run a test query in Supabase SQL Editor
   SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 5;
   ```

#### Option D: Rollback Edge Functions (For Edge Function Issues)

**Method 1: Redeploy Previous Version**

Edge Functions don't have built-in versioning, so you'll need to redeploy from a previous commit:

```bash
# Checkout the last working commit
git checkout <previous-commit-sha>

# Link to Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Redeploy the functions
supabase functions deploy

# Return to main branch
git checkout main
```

**Method 2: Delete Problematic Function**

If a function is causing issues:

```bash
# Delete the function
supabase functions delete blog-get-post

# Or delete via Supabase Dashboard:
# Dashboard → Edge Functions → Select function → Delete
```

**Method 3: Via Supabase Dashboard**

1. Go to Supabase Dashboard → **Edge Functions**
2. Select the problematic function
3. Click **Delete** or manually redeploy from the UI
4. Upload the previous version of the function code

### Post-Rollback Steps

After any rollback:

1. **Notify team** that rollback occurred
2. **Document the issue:**
   - What broke?
   - Which deployment caused it?
   - What was rolled back?
3. **Create GitHub issue** to track the bug
4. **Fix the issue** in a new branch
5. **Test thoroughly** before merging to main again
6. **Consider adding tests** to prevent regression

### Preventing Failed Deployments

To avoid needing rollbacks:

1. **Always test locally first:**

   ```bash
   npm run build
   npm run lint
   npm run type-check
   ```

2. **Test migrations locally:**

   ```bash
   supabase db reset  # Reset local DB
   supabase db push   # Apply all migrations
   # Verify app works with new schema
   ```

3. **Test Edge Functions locally:**

   ```bash
   # Start Supabase locally
   supabase start

   # Serve functions locally
   supabase functions serve

   # Test the functions (replace with actual function names)
   curl http://localhost:54321/functions/v1/your-function-name?param=value
   curl http://localhost:54321/functions/v1/another-function
   ```

4. **Use feature flags** for risky changes
5. **Deploy during low-traffic hours**
6. **Monitor deployment logs** in real-time
7. **Have a rollback plan** before deploying

---

## 🔧 Troubleshooting

### Common Issues

#### Issue 1: "VERCEL_TOKEN is invalid"

**Cause:** Token expired or incorrect

**Fix:**

1. Generate new token at https://vercel.com/account/tokens
2. Update GitHub secret `VERCEL_TOKEN`
3. Re-run workflow

#### Issue 2: "Migration failed: relation already exists"

**Cause:** Migration was partially applied or run twice

**Fix:**

```bash
# Check migration status
supabase migration list

# If migration is marked as applied but failed:
# 1. Fix the migration SQL file
# 2. Manually apply the fixed version in Supabase SQL Editor
# 3. Mark it as applied in schema_migrations table
```

#### Issue 3: "Build failed: Module not found"

**Cause:** Missing dependency or import error

**Fix:**

1. Check the error log for the missing module
2. Verify `package.json` includes the dependency
3. Run `npm install` locally to test
4. Commit `package-lock.json` if updated
5. Push to trigger new deployment

#### Issue 4: "Failed to collect configuration for /blog/[slug]" (MAIN_SITE_URL is not defined)

**Cause:** `MAIN_SITE_URL` is missing during the build, but `/blog/[slug]` requires it to generate metadata and redirect non-bot traffic.

**Fix:**

1. Add `MAIN_SITE_URL` to **GitHub Repository Secrets** (Actions).
2. Add `MAIN_SITE_URL` to **Vercel Environment Variables** (Production).
3. Use a supported format (JSON array string).
4. Re-run the workflow / redeploy.

#### Issue 5: "Failed to collect configuration for /admin/users/[id]" (Missing API key for Resend)

**Cause:** `RESEND_API_KEY` is missing during the build, but server-side modules can still be evaluated during `next build` when Next.js collects route configuration/page data.

**Fix:**

1. Add `RESEND_API_KEY` to **GitHub Repository Secrets** (Actions).
2. Add `RESEND_API_KEY` to **Vercel Environment Variables** (Production).
3. Re-run the workflow / redeploy.

#### Issue 6: "Deployment succeeded but app shows 500 error"

**Cause:** Runtime environment variable missing or incorrect

**Fix:**

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Verify all required variables are set for Production
3. Click **Redeploy** in Vercel Dashboard
4. Or push a new commit to trigger redeployment

#### Issue 7: "Supabase connection failed"

**Cause:** Wrong credentials or network issue

**Fix:**

1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
3. Check Supabase project is not paused
4. Test connection locally:
   ```bash
   curl https://YOUR_PROJECT_REF.supabase.co/rest/v1/
   ```

#### Issue 8: "Workflow stuck on 'Waiting for deployment'"

**Cause:** Vercel deployment hanging

**Fix:**

1. Cancel the workflow in GitHub Actions
2. Check Vercel Dashboard for stuck deployments
3. Cancel any stuck deployments in Vercel
4. Re-run the workflow

#### Issue 9: "Edge Functions deployment failed"

**Cause:** Function code error, missing dependencies, or Supabase CLI issue

**Fix:**

1. Check the `edge-functions-logs` artifact in GitHub Actions
2. Verify function code syntax is correct
3. Test functions locally:
   ```bash
   supabase functions serve
   ```
4. Check Supabase Dashboard → Edge Functions for error details
5. Verify `_shared/blog-utils.ts` is accessible to both functions
6. Ensure Deno import URLs are valid and accessible

#### Issue 10: "Edge Function returns 403 Forbidden"

**Cause:** Domain not in allowed domains list or CORS issue

**Fix:**

1. Go to Supabase Dashboard → SQL Editor
2. Check `allowed_domains` table:
   ```sql
   SELECT * FROM allowed_domains WHERE is_active = true;
   ```
3. Add missing domain:
   ```sql
   INSERT INTO allowed_domains (domain, is_active)
   VALUES ('https://your-domain.com', true);
   ```
4. Verify the Edge Function's CORS headers are correct
5. Test with curl:
   ```bash
   curl -H "Origin: https://your-domain.com" \
        https://YOUR_PROJECT_REF.supabase.co/functions/v1/your-function-name?param=value
   ```

### Getting Help

If you encounter issues not covered here:

1. **Check workflow logs:**
   - GitHub Actions → Failed workflow → Click on failed step
   - Download artifacts (migration-logs, deployment-logs)

2. **Check Vercel logs:**
   - Vercel Dashboard → Deployments → Click deployment → Runtime Logs

3. **Check Supabase logs:**
   - Supabase Dashboard → Logs → Select service (API, Auth, etc.)

4. **Review recent changes:**

   ```bash
   git log --oneline -10
   git diff HEAD~1 HEAD
   ```

5. **Contact support:**
   - Vercel: https://vercel.com/support
   - Supabase: https://supabase.com/support

---

## 📚 Additional Resources

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

---

## 🔒 Security Best Practices

1. **Never commit secrets** to the repository
2. **Rotate tokens** every 90 days
3. **Use least-privilege access** for service accounts
4. **Enable 2FA** on Vercel and Supabase accounts
5. **Monitor deployment logs** for suspicious activity
6. **Keep dependencies updated** with `npm audit`
7. **Review Vercel deployment logs** regularly

---

**Last Updated:** December 2025  
**Maintained By:** DevOps Team
