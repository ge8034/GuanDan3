const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

async function executeMigration(sql, filename) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error(`Error executing ${filename}:`, error);
      return false;
    }
    
    console.log(`✓ Successfully executed: ${filename}`);
    return true;
  } catch (err) {
    console.error(`Error executing ${filename}:`, err.message);
    return false;
  }
}

async function main() {
  console.log('Starting database migrations...');
  console.log(`Supabase URL: ${supabaseUrl}`);
  
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  console.log(`Found ${migrationFiles.length} migration files`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log(`\nExecuting: ${file}`);
    const success = await executeMigration(sql, file);
    
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  console.log(`\n========================================`);
  console.log(`Migration Summary:`);
  console.log(`  Total: ${migrationFiles.length}`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Failed: ${failCount}`);
  console.log(`========================================`);
  
  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});