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
  console.error('\nCurrent environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

async function executeMigration(sql, filename) {
  try {
    const { data, error } = await supabase.from('_temp_migration').select('*').limit(1);
    
    if (error && error.code !== 'PGRST116') {
      console.error(`Error checking connection for ${filename}:`, error);
      return false;
    }
    
    console.log(`✓ Connection verified for: ${filename}`);
    console.log(`  Note: Please run migrations manually via Supabase Dashboard`);
    console.log(`  Dashboard: https://supabase.com/dashboard/project/${supabaseUrl.split('//')[1].split('.')[0]}`);
    return true;
  } catch (err) {
    console.error(`Error with ${filename}:`, err.message);
    return false;
  }
}

async function main() {
  console.log('Checking database migration files...');
  console.log(`Supabase URL: ${supabaseUrl}`);
  
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  console.log(`Found ${migrationFiles.length} migration files`);
  
  const projectId = supabaseUrl.split('//')[1].split('.')[0];
  
  console.log(`\n========================================`);
  console.log(`Migration Instructions:`);
  console.log(`========================================`);
  console.log(`\nSince Supabase CLI is not available, please run migrations manually:`);
  console.log(`\n1. Open Supabase Dashboard:`);
  console.log(`   https://supabase.com/dashboard/project/${projectId}`);
  console.log(`\n2. Go to SQL Editor`);
  console.log(`\n3. Execute each migration file in order:`);
  
  migrationFiles.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file}`);
  });
  
  console.log(`\n4. Or use the Supabase CLI if available:`);
  console.log(`   supabase link --project-ref ${projectId}`);
  console.log(`   supabase db push`);
  
  console.log(`\n========================================`);
  console.log(`Migration Files Location:`);
  console.log(`${migrationsDir}`);
  console.log(`========================================`);
  
  const firstFile = migrationFiles[0];
  if (firstFile) {
    const filePath = path.join(migrationsDir, firstFile);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log(`\nFirst migration preview (${firstFile}):`);
    console.log('---');
    console.log(sql.substring(0, 500) + (sql.length > 500 ? '...' : ''));
    console.log('---');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});