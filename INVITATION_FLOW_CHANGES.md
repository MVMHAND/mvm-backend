# User Invitation Flow - Implementation Changes

## Overview
Replaced Supabase Auth's built-in invitation system with a custom database-driven flow to fix the login issue where invited users couldn't log in.

## Key Changes

### 1. Database Migration
**File**: `supabase/migrations/20241130000000_user_invitations.sql`
- Created `user_invitations` table to track pending invitations
- Stores invitation tokens (hashed for security)
- Tracks expiration (48 hours), acceptance status, and inviter

**Run migration**:
```bash
npx supabase migration up
```

### 2. Updated Invitation Action
**File**: `src/actions/users.ts`

#### `inviteUserAction` Changes:
- **Before**: Used `adminClient.auth.admin.inviteUserByEmail()` - created user in Supabase Auth immediately
- **After**: 
  - Generates secure random token (64 char hex)
  - Stores hashed token in `user_invitations` table
  - Sends email with unhashed token in URL
  - Does NOT create Supabase Auth user yet

#### Key Flow:
1. Check if user or pending invitation exists
2. Generate secure token + hash it (SHA-256)
3. Store invitation in database (expires in 48 hours)
4. Send custom email via Resend with link to `/auth/accept-invitation?token=...`
5. If email fails, delete the invitation record

### 3. New Accept Invitation Flow
**Files**: 
- `src/actions/invitations.ts` (new)
- `src/app/auth/accept-invitation/page.tsx` (new)

#### Server Actions:
1. **`verifyInvitationTokenAction`**:
   - Verifies token is valid and not expired
   - Returns invitation details (name, email, role)

2. **`acceptInvitationAction`**:
   - Validates password strength (min 8 chars)
   - Creates user in Supabase Auth with confirmed email
   - Creates profile record with `status: 'active'`
   - Marks invitation as accepted
   - Creates audit log

#### Page Flow:
1. User clicks email link with token
2. Page verifies token on mount
3. Shows error if invalid/expired
4. If valid, shows password setup form
5. On submit, creates auth user + profile
6. Redirects to login after 2 seconds

### 4. Updated Delete User Action
**File**: `src/actions/users.ts`

#### `deleteUserAction` Changes:
- **Before**: Only soft-deleted in profiles table (set status to 'deleted')
- **After**: 
  - Soft-deletes in profiles (status = 'deleted')
  - Hard-deletes from Supabase Auth using `adminClient.auth.admin.deleteUser()`
  - If Auth deletion fails, continues anyway (profile already marked deleted)

## Testing Checklist

### 1. Run the Migration
```bash
cd supabase
npx supabase migration up
```

### 2. Test Invitation Flow
1. **Send Invitation**:
   - Log in as admin
   - Go to `/admin/users/invite`
   - Fill form with test email
   - Submit

2. **Check Database**:
   ```sql
   SELECT * FROM user_invitations WHERE email = 'test@example.com';
   ```
   - Should see record with hashed token and future expiration

3. **Check Email**:
   - Open email sent to test address
   - Should have link to `/auth/accept-invitation?token=...`
   - Token should be 64 character hex string

4. **Accept Invitation**:
   - Click link in email
   - Should see "Set Up Your Account" page
   - Enter password (min 8 chars)
   - Confirm password
   - Submit

5. **Verify User Created**:
   ```sql
   -- Should have auth user
   SELECT * FROM auth.users WHERE email = 'test@example.com';
   
   -- Should have profile with active status
   SELECT * FROM profiles WHERE email = 'test@example.com';
   
   -- Invitation should be marked accepted
   SELECT * FROM user_invitations WHERE email = 'test@example.com';
   ```

6. **Test Login**:
   - Go to `/admin/login`
   - Enter invited user's email + password
   - Should successfully log in

### 3. Test Delete Flow
1. Delete the test user from UI
2. Verify soft-delete in profiles:
   ```sql
   SELECT id, email, status FROM profiles WHERE email = 'test@example.com';
   -- status should be 'deleted'
   ```
3. Verify hard-delete from Auth:
   ```sql
   SELECT * FROM auth.users WHERE email = 'test@example.com';
   -- should return no rows
   ```

### 4. Test Edge Cases
- [ ] Expired invitation (manually update expires_at to past date)
- [ ] Duplicate invitation (try inviting same email twice)
- [ ] Invalid token (modify token in URL)
- [ ] Email already exists (invite existing user)
- [ ] Weak password (< 8 chars)
- [ ] Password mismatch (different confirm password)

## Benefits of New Approach

1. **Fixes Login Issue**: Users are only created in Supabase Auth after they set their password
2. **Better Security**: Token is hashed in database, only sent unhashed via email
3. **Full Control**: Complete control over invitation flow and expiration
4. **Audit Trail**: Tracks who invited whom and when invitations are accepted
5. **Clean Deletion**: Deleting users now removes them from Auth too
6. **Better UX**: Clear, branded invitation acceptance page

## Migration Notes

- Old `setup-password` page still exists but is no longer used
- Can be removed in future cleanup
- `activateUserAfterSetupAction` in users.ts is also unused now
- Profiles table still has `invited` status but won't be used for new invitations
- Old approach created users with `status: 'invited'` - new approach creates them with `status: 'active'`

## Environment Variables Required

Ensure these are set:
- `NEXT_PUBLIC_SITE_URL` - Your site URL for email links
- `RESEND_API_KEY` - Resend API key for sending emails
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)

## Rollback Plan

If issues arise:
1. Revert changes to `src/actions/users.ts` (restore old inviteUserAction)
2. Drop user_invitations table: `DROP TABLE user_invitations;`
3. Delete new files:
   - `src/actions/invitations.ts`
   - `src/app/auth/accept-invitation/page.tsx`
4. Continue using old Supabase Auth invite flow
