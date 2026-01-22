const { execSync } = require('child_process')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.prod') })

const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(
  /https:\/\/([^.]+)\.supabase\.co/
)?.[1]

if (!projectRef) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL in .env.prod')
  process.exit(1)
}

try {
  console.log(`📋 Listing functions for: ${projectRef}`)
  execSync(`supabase functions list --project-ref ${projectRef}`, { stdio: 'inherit' })
} catch (error) {
  console.error('❌ List failed:', error.message)
  process.exit(1)
}
