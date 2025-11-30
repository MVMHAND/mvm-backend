#!/usr/bin/env tsx

/**
 * Deploy-time script to sync permissions from menu config to database
 * Run this after deployment or schema changes to ensure permissions table is up-to-date
 *
 * Usage:
 *   npm run sync-permissions                    # Uses .env.local (development)
 *   NODE_ENV=production npm run sync-permissions # Uses .env.production.local or .env.production
 *   NODE_ENV=test npm run sync-permissions       # Uses .env.test.local or .env.test
 */

import { config } from 'dotenv'
import { existsSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { getAllPermissionMetadata } from '../src/config/menu'

// Load environment variables with precedence:
// 1. .env.{NODE_ENV}.local (e.g., .env.production.local)
// 2. .env.local (default for local development)
// 3. .env.{NODE_ENV} (e.g., .env.production)
// 4. .env (fallback)
const nodeEnv = process.env.NODE_ENV || 'development'
const envFiles = [
  `.env.${nodeEnv}.local`,
  '.env.local',
  `.env.${nodeEnv}`,
  '.env',
]

let envFileLoaded = false
for (const envFile of envFiles) {
  if (existsSync(envFile)) {
    console.log(`📄 Loading environment from: ${envFile}\n`)
    config({ path: envFile })
    envFileLoaded = true
    break
  }
}

if (!envFileLoaded) {
  console.warn('⚠️  No .env file found, using system environment variables\n')
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

async function syncPermissions() {
  console.log('🔄 Syncing permissions from menu config...\n')

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  try {
    const allPermissions = getAllPermissionMetadata()

    if (!allPermissions.length) {
      console.error('❌ No permissions found in config')
      process.exit(1)
    }

    console.log(`📋 Found ${allPermissions.length} permission(s) in config:`)
    allPermissions.forEach((p) => console.log(`   - ${p.key}`))
    console.log()

    const { data: existingPermissions, error: fetchError } = await supabase
      .from('permissions')
      .select('permission_key')

    if (fetchError) {
      console.error('❌ Failed to fetch existing permissions:', fetchError.message)
      process.exit(1)
    }

    const existingKeys = existingPermissions?.map((p) => p.permission_key) || []
    console.log(`📊 Existing permissions in database: ${existingKeys.length}`)

    const permissionsToUpsert = allPermissions.map((p) => ({
      permission_key: p.key,
      label: p.label,
      description: p.description,
      group: p.group,
    }))

    const desiredKeys = allPermissions.map((p) => p.key)
    const keysToDelete = existingKeys.filter((key) => !desiredKeys.includes(key))

    if (keysToDelete.length > 0) {
      console.log(`\n🗑️  Deleting ${keysToDelete.length} stale permission(s):`)
      keysToDelete.forEach((key) => console.log(`   - ${key}`))

      const { error: deleteError } = await supabase
        .from('permissions')
        .delete()
        .in('permission_key', keysToDelete)

      if (deleteError) {
        console.error('❌ Failed to delete stale permissions:', deleteError.message)
        process.exit(1)
      }

      console.log('✅ Stale permissions deleted (including linked role_permissions via CASCADE)')
    } else {
      console.log('\n✨ No stale permissions to delete')
    }

    console.log(`\n💾 Upserting ${permissionsToUpsert.length} permission(s)...`)

    const { error: upsertError } = await supabase
      .from('permissions')
      .upsert(permissionsToUpsert, { onConflict: 'permission_key' })

    if (upsertError) {
      console.error('❌ Failed to upsert permissions:', upsertError.message)
      process.exit(1)
    }

    console.log('✅ Permissions upserted successfully')
    console.log('\n✨ Permission sync completed!\n')
    console.log('Summary:')
    console.log(`   Upserted: ${permissionsToUpsert.length}`)
    console.log(`   Deleted:  ${keysToDelete.length}`)
    console.log()

    process.exit(0)
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

syncPermissions()
