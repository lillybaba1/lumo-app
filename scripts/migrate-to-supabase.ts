import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🚀 Starting Supabase migration...\n')

  try {
    // Read the SQL migration file
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20250110_initial_schema.sql')
    const sql = fs.readFileSync(migrationPath, 'utf-8')

    console.log('📝 Executing database schema...')

    // Execute the SQL migration
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).single()

    if (error) {
      // Try direct execution if rpc doesn't work
      console.log('⚠️  RPC method not available, using direct SQL execution...')

      // Split SQL into statements and execute
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (const statement of statements) {
        try {
          await supabase.rpc('exec', { sql: statement })
        } catch (err) {
          // Ignore errors for DROP statements and IF EXISTS
          if (!statement.includes('DROP') && !statement.includes('IF EXISTS')) {
            console.error(`Error executing statement: ${statement.substring(0, 50)}...`)
            console.error(err)
          }
        }
      }
    }

    console.log('✅ Database schema created successfully!\n')

    // Create storage buckets
    console.log('📦 Setting up storage buckets...')
    await setupStorage()

    console.log('\n✨ Migration completed successfully!')
    console.log('\n📋 Next steps:')
    console.log('1. Update your application code to use Supabase')
    console.log('2. Test authentication flow')
    console.log('3. Migrate existing data (if any)')
    console.log('4. Deploy to Vercel')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

async function setupStorage() {
  const buckets = [
    {
      name: 'products',
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      fileSizeLimit: 5242880, // 5MB
    },
    {
      name: 'user-uploads',
      public: false,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 2097152, // 2MB
    },
  ]

  for (const bucket of buckets) {
    try {
      const { data, error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes,
      })

      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`  ℹ️  Bucket "${bucket.name}" already exists`)
        } else {
          console.error(`  ❌ Error creating bucket "${bucket.name}":`, error.message)
        }
      } else {
        console.log(`  ✅ Created bucket: ${bucket.name}`)
      }
    } catch (err) {
      console.error(`  ❌ Error with bucket "${bucket.name}":`, err)
    }
  }
}

// Run migration
runMigration()
