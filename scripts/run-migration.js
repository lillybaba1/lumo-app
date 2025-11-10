const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!')
  console.error('Please ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  console.log('🚀 Starting Supabase migration...\n')
  console.log(`📍 Supabase URL: ${supabaseUrl}\n`)

  try {
    // Read the SQL migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250110_initial_schema.sql')
    console.log(`📝 Reading migration file: ${migrationPath}`)

    const sql = fs.readFileSync(migrationPath, 'utf-8')
    console.log(`✅ Migration file loaded (${sql.length} characters)\n`)

    console.log('⚙️  Executing database schema...')
    console.log('   This may take a minute...\n')

    // Execute SQL using Supabase client
    // Note: We need to use the REST API directly for DDL statements
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ sql })
    })

    if (!response.ok) {
      // If RPC doesn't work, we'll output instructions for manual execution
      console.log('⚠️  Automated SQL execution not available.')
      console.log('\n📋 Please run the migration manually:')
      console.log('1. Go to your Supabase Dashboard')
      console.log('2. Navigate to SQL Editor')
      console.log(`3. Open the file: supabase/migrations/20250110_initial_schema.sql`)
      console.log('4. Copy and paste the content into the SQL Editor')
      console.log('5. Click "Run" to execute\n')

      console.log('💡 Alternatively, you can use the Supabase CLI:')
      console.log('   npx supabase db push\n')

      return
    }

    console.log('✅ Database schema created successfully!\n')

    // Create storage buckets
    console.log('📦 Setting up storage buckets...')
    await setupStorage()

    console.log('\n✨ Migration completed successfully!')
    console.log('\n📋 Next steps:')
    console.log('1. ✅ Database schema created')
    console.log('2. ✅ Storage buckets configured')
    console.log('3. 🔄 Update authentication in signup/login forms')
    console.log('4. 🔄 Migrate API routes to use Supabase')
    console.log('5. 🚀 Deploy to Vercel')

  } catch (error) {
    console.error('❌ Migration error:', error.message)
    console.log('\n💡 Manual migration steps:')
    console.log('1. Go to https://supabase.com/dashboard')
    console.log('2. Select your project')
    console.log('3. Go to SQL Editor')
    console.log('4. Run the SQL from: supabase/migrations/20250110_initial_schema.sql')
  }
}

async function setupStorage() {
  const buckets = [
    {
      name: 'products',
      public: true,
      options: {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      }
    },
    {
      name: 'user-uploads',
      public: false,
      options: {
        public: false,
        fileSizeLimit: 2097152, // 2MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      }
    },
  ]

  for (const bucket of buckets) {
    try {
      const { data, error } = await supabase.storage.createBucket(bucket.name, bucket.options)

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
      console.error(`  ❌ Error with bucket "${bucket.name}":`, err.message)
    }
  }
}

// Run migration
runMigration().then(() => {
  console.log('\n👋 Done!')
  process.exit(0)
}).catch(err => {
  console.error('\n❌ Fatal error:', err)
  process.exit(1)
})
