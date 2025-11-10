const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupStorage() {
  console.log('📦 Setting up Supabase Storage buckets...\n')

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

  console.log('\n✨ Storage setup complete!')
}

setupStorage().then(() => {
  console.log('\n👋 Done!')
  process.exit(0)
}).catch(err => {
  console.error('\n❌ Fatal error:', err)
  process.exit(1)
})
