# Phase 1 Setup Guide - My Virtual Mate

This guide will help you set up and run the My Virtual Mate admin panel (Phase 1: Foundation & Authentication).

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** (comes with Node.js) or **yarn**/**pnpm**
- **Git** (for version control)
- **Supabase Account** ([Sign up](https://supabase.com/))
- **Resend Account** ([Sign up](https://resend.com/)) - For future phases

## Step 1: Install Dependencies

Navigate to the project directory and install all required packages:

```bash
cd "c:\Users\Mohd Faheem Ansari\MVM Files\_git\new3"
npm install
```

This will install:
- Next.js 15
- React 19
- Supabase libraries
- Tailwind CSS
- TypeScript
- And all other dependencies

## Step 2: Set Up Supabase Project

### 2.1 Create a New Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in the details:
   - **Name**: My Virtual Mate (or your choice)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Select the closest region to your users
4. Click "Create new project" and wait for it to initialize (2-3 minutes)

### 2.2 Get Your Supabase Credentials

Once your project is created:

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - Keep this secret!

### 2.3 Run Database Migrations

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Open the file `supabase/migrations/20241128000000_initial_schema.sql`
4. Copy all the SQL content
5. Paste it into the SQL Editor in Supabase
6. Click "Run" to execute the migration

This will create:
- All necessary tables (profiles, roles, permissions, etc.)
- Row-Level Security (RLS) policies
- Database triggers and functions
- Seed data (Super Admin role and default roles)

## Step 3: Configure Environment Variables

1. Copy the example environment file:

```bash
copy .env.local.example .env.local
```

2. Open `.env.local` in a text editor and fill in the values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Resend Email API (optional for Phase 1, required for Phase 5)
RESEND_API_KEY=your-resend-api-key-here

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Important**: Replace all placeholder values with your actual Supabase credentials from Step 2.2.

## Step 4: Create Your First Admin User

Since there's no self-service signup, you need to create your first admin user manually through Supabase:

### 4.1 Create Auth User

1. In Supabase Dashboard, go to **Authentication** → **Users**
2. Click "Add user" → "Create new user"
3. Fill in:
   - **Email**: Your email address
   - **Password**: Choose a secure password
   - **Auto Confirm User**: Check this box
4. Click "Create user"

### 4.2 Link User to Profile

1. Go to **Table Editor** → **profiles**
2. Click "Insert" → "Insert row"
3. Fill in:
   - **id**: Paste the User ID from the auth user you just created
   - **name**: Your name (e.g., "John Doe")
   - **email**: Same email as the auth user
   - **status**: Select "active"
   - **role_id**: Select the "Super Admin" role from the dropdown
4. Click "Save"

You now have a Super Admin account!

## Step 5: Run the Development Server

Start the Next.js development server:

```bash
npm run dev
```

The application will start on [http://localhost:3000](http://localhost:3000)

## Step 6: Test the Application

### Public Coming Soon Page

1. Open [http://localhost:3000](http://localhost:3000)
2. You should see the "My Virtual Mate" coming soon page with:
   - MVM logo
   - Brand gradient (blue to yellow)
   - "Learn More" and "Admin Login" buttons

### Admin Login

1. Click "Admin Login" or navigate to [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
2. Enter the credentials you created in Step 4:
   - **Email**: Your Super Admin email
   - **Password**: Your chosen password
3. Click "Sign In"

### Admin Dashboard

After successful login, you should be redirected to [http://localhost:3000/admin](http://localhost:3000/admin) where you'll see:
- Welcome message with your email
- Placeholder cards for future features
- Phase 1 completion message

## Troubleshooting

### Common Issues

#### "Cannot find module" errors

**Solution**: Make sure you've run `npm install`. If issues persist, try:
```bash
rm -rf node_modules package-lock.json
npm install
```

#### Database connection errors

**Solution**: 
- Verify your Supabase credentials in `.env.local`
- Ensure your Supabase project is active
- Check that you've run the migration SQL

#### Login fails with "Invalid email or password"

**Solution**:
- Verify the user was created in Supabase Authentication
- Ensure you marked "Auto Confirm User" when creating the user
- Check that the email in `auth.users` matches the email in `profiles`
- Make sure the user's status is "active" in the profiles table

#### Middleware redirects causing issues

**Solution**:
- Clear your browser cookies and cache
- Try incognito/private browsing mode
- Check browser console for errors

### Getting Help

If you encounter issues not covered here:

1. Check the browser console for errors (F12 → Console tab)
2. Check the terminal where `npm run dev` is running for server errors
3. Review the Supabase logs in the dashboard
4. Ensure all environment variables are correctly set

## Next Steps

Phase 1 is complete! You now have:
- ✅ A working Next.js application with TypeScript
- ✅ Supabase integration for authentication and database
- ✅ Public coming soon page
- ✅ Admin login functionality
- ✅ Protected admin routes
- ✅ Database schema with RLS policies
- ✅ Super Admin role and user

### Upcoming Phases

- **Phase 2**: User Management (invite, edit, deactivate users)
- **Phase 3**: Role & Permission Management (permission matrix)
- **Phase 4**: Navigation System & Dashboard (dynamic menu)
- **Phase 5**: Email Integration & Audit Logging (Resend, tracking)

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Sync permissions from menu config to database
npm run sync-permissions

# Run linting
npm run lint

# Format code
npm run format

# Check TypeScript types
npm run type-check
```

### Permission Sync

The `sync-permissions` script ensures the `permissions` table in your database stays in sync with the menu configuration defined in `src/config/menu.ts`.

**How it works:**
- Each menu item in `MENU_CONFIG` can define a `relatedPermissions` array containing all CRUD operations for that section
- The sync script extracts all permissions from these arrays and syncs them to the database
- **Upserts** all permission definitions (with label, group, description)
- **Deletes** any permissions in the database that are no longer in the menu config (CASCADE removes linked `role_permissions` rows)

**When to run:**
- Automatically runs after `npm run build` via the `postbuild` hook
- Manually run `npm run sync-permissions` after changing menu config during development
- Run in CI/CD pipeline before deployment to ensure permissions are up-to-date

**Environment Configuration:**

The script loads environment variables from files in this order of precedence:
1. `.env.{NODE_ENV}.local` (e.g., `.env.production.local`)
2. `.env.local` (default for local development)
3. `.env.{NODE_ENV}` (e.g., `.env.production`)
4. `.env` (fallback)

**Examples:**
```bash
# Development (uses .env.local)
npm run sync-permissions

# Production (uses .env.production.local or .env.production)
NODE_ENV=production npm run sync-permissions

# Test environment
NODE_ENV=test npm run sync-permissions
```

**Requirements:**
- `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables must be set in your env file or system environment

## Project Structure

```
my-virtual-mate/
├── src/
│   ├── app/              # Next.js pages and layouts
│   ├── components/       # React components
│   ├── config/           # Menu and app configuration
│   ├── lib/              # Utilities and configurations
│   ├── types/            # TypeScript type definitions
│   ├── actions/          # Server actions
│   └── hooks/            # Custom React hooks (future)
├── scripts/
│   └── sync-permissions.ts  # Deploy-time permission sync
├── supabase/
│   └── migrations/       # Database migrations
├── public/               # Static assets
└── middleware.ts         # Route protection
```

---

**Congratulations!** You've successfully set up Phase 1 of My Virtual Mate. 🎉
