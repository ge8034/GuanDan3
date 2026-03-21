const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && !key.startsWith('#') && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    });
  }
}

loadEnvFile();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

async function executeSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
}

async function executeMigration(sql, filename) {
  console.log(`\nExecuting: ${filename}`);
  console.log('---');
  
  try {
    const result = await executeSQL(sql);
    
    if (result.success) {
      console.log(`✓ Successfully executed: ${filename}`);
      return true;
    } else {
      console.error(`✗ Failed to execute ${filename}:`);
      console.error(`  Error: ${result.error.message}`);
      return false;
    }
  } catch (error) {
    console.error(`✗ Error executing ${filename}:`);
    console.error(`  ${error.message}`);
    return false;
  }
}

async function testConnection() {
  console.log('Testing database connection...');
  try {
    const { data, error } = await supabase.from('rooms').select('*').limit(1);
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    console.log('✓ Database connection successful');
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:');
    console.error(`  ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('========================================');
  console.log('Supabase Database Migration Tool');
  console.log('========================================');
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Migrations directory: ${migrationsDir}`);
  
  const connected = await testConnection();
  if (!connected) {
    console.log('\nNote: Connection test failed, but this might be expected if tables do not exist yet.');
    console.log('Proceeding with migration execution...');
  }
  
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  console.log(`\nFound ${migrationFiles.length} migration files`);
  
  console.log('\n========================================');
  console.log('Migration Files:');
  console.log('========================================');
  migrationFiles.forEach((file, index) => {
    console.log(`${index + 1}. ${file}`);
  });
  
  console.log('\n========================================');
  console.log('Starting Migration Execution...');
  console.log('========================================');
  
  let successCount = 0;
  let failCount = 0;
  const failedMigrations = [];
  
  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    const success = await executeMigration(sql, file);
    
    if (success) {
      successCount++;
    } else {
      failCount++;
      failedMigrations.push(file);
    }
  }
  
  console.log('\n========================================');
  console.log('Migration Summary:');
  console.log('========================================');
  console.log(`Total migrations: ${migrationFiles.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  
  if (failedMigrations.length > 0) {
    console.log('\nFailed migrations:');
    failedMigrations.forEach(file => {
      console.log(`  - ${file}`);
    });
  }
  
  console.log('========================================');
  
  if (failCount > 0) {
    console.error('\n❌ Migration completed with errors');
    process.exit(1);
  } else {
    console.log('\n✅ All migrations executed successfully!');
  }
}

main().catch(err => {
  console.error('\nFatal error:', err);
  process.exit(1);
});