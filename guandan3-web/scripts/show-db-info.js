const fs = require('fs');
const path = require('path');

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

console.log('========================================');
console.log('Supabase Database Connection Info');
console.log('========================================');
console.log(`Supabase URL: ${supabaseUrl}`);
console.log(`API Key: ${supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'Not set'}`);
console.log('');
console.log('To connect to the database directly, you need:');
console.log('1. Database password (not the API key)');
console.log('2. Database connection string from Supabase Dashboard');
console.log('');
console.log('Steps to get database connection info:');
console.log('1. Go to https://supabase.com/dashboard');
console.log('2. Select your project: rzzywltxlfgucngfiznx');
console.log('3. Go to Settings > Database');
console.log('4. Find "Connection string" section');
console.log('5. Copy the connection string for "URI" or "Node.js"');
console.log('6. Replace <password> with your database password');
console.log('');
console.log('The connection string should look like:');
console.log('postgresql://postgres:[YOUR-PASSWORD]@db.rzzywltxlfgucngfiznx.supabase.co:5432/postgres');
console.log('');
console.log('========================================');
console.log('Alternative: Use Supabase Dashboard SQL Editor');
console.log('========================================');
console.log('1. Go to https://supabase.com/dashboard/project/rzzywltxlfgucngfiznx/sql');
console.log('2. Copy and paste each migration file content');
console.log('3. Execute each migration one by one');
console.log('');
console.log('Migration files location:');
console.log(path.join(__dirname, '..', 'supabase', 'migrations'));
console.log('');
console.log('Total migration files:');
const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();
console.log(migrationFiles.length);
console.log('');
console.log('Migration files:');
migrationFiles.forEach((file, index) => {
  console.log(`${index + 1}. ${file}`);
});
console.log('========================================');