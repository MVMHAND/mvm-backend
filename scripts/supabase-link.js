const { execSync } = require('child_process')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.prod') })

const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(
  /https:\/\/([^.]+)\.supabase\.co/
)?.[1]
const password = process.env.SUPABASE_DB_PASSWORD

if (!projectRef || !password) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_DB_PASSWORD in .env.prod')
  process.exit(1)
}

try {
  console.log(`🔗 Linking to project: ${projectRef}`)
  execSync(`supabase link --project-ref ${projectRef} --password ${password}`, { stdio: 'inherit' })
  console.log('✅ Successfully linked to production')
} catch (error) {
  console.error('❌ Link failed:', error.message)
  process.exit(1)
}
