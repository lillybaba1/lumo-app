/**
 * SQL Migration Runner
 * Executes the marketplace schema migration SQL file
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runSQLMigration() {
  console.log('🚀 Running SQL Schema Migration...\n');

  try {
    // Read the SQL migration file
    const sqlPath = path.join(process.cwd(), 'migrations', '001_marketplace_schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    console.log('📄 Read migration file:', sqlPath);
    console.log('📏 SQL content length:', sqlContent.length, 'characters\n');

    // Split SQL into individual statements (basic split on semicolons)
    // Note: This is a simple approach. For complex SQL, you might need a proper parser
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip comments and empty lines
      if (statement.startsWith('--') || statement.trim() === '') {
        continue;
      }

      console.log(`Executing statement ${i + 1}/${statements.length}...`);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

        if (error) {
          // If exec_sql RPC doesn't exist, we'll need to use direct SQL execution
          // Supabase doesn't allow arbitrary SQL via the client, so we'll use a different approach
          throw error;
        }

        successCount++;
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (error: any) {
        // For Supabase, we need to use their migration system or direct database access
        // Let's output the SQL for manual execution
        errorCount++;
        console.log(`⚠️  Statement ${i + 1} needs manual execution (Supabase limitation)`);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`Successful: ${successCount}`);
    console.log(`Errors/Manual: ${errorCount}`);
    console.log('\n⚠️  Note: Supabase requires SQL migrations to be run via their dashboard or CLI');
    console.log('Please execute the following SQL in your Supabase SQL Editor:\n');
    console.log('Dashboard → SQL Editor → New Query → Paste and Run\n');
    console.log('File location:', sqlPath);
    console.log('\n✅ After running the SQL migration, run the data migration:');
    console.log('   npm run migrate:data\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

runSQLMigration()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
