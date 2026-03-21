const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
const outputPath = path.join(__dirname, '..', 'all-migrations.sql');

const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log('Merging all migration files...');

let mergedContent = '';
mergedContent += '-- =========================================\n';
mergedContent += '-- Guandan3 Database Migrations\n';
mergedContent += '-- =========================================\n';
mergedContent += '-- Total migrations: ' + migrationFiles.length + '\n';
mergedContent += '-- Generated: ' + new Date().toISOString() + '\n';
mergedContent += '-- =========================================\n\n';

migrationFiles.forEach((file, index) => {
  const filePath = path.join(migrationsDir, file);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  mergedContent += '-- =========================================\n';
  mergedContent += '-- Migration ' + (index + 1) + '/' + migrationFiles.length + ': ' + file + '\n';
  mergedContent += '-- =========================================\n\n';
  mergedContent += sql;
  mergedContent += '\n\n';
});

fs.writeFileSync(outputPath, mergedContent);

console.log('Merged ' + migrationFiles.length + ' migration files');
console.log('Output: ' + outputPath);
console.log('');
console.log('To execute these migrations:');
console.log('1. Open https://supabase.com/dashboard/project/rzzywltxlfgucngfiznx/sql');
console.log('2. Copy the content of all-migrations.sql');
console.log('3. Paste into the SQL Editor');
console.log('4. Click "Run" to execute');
console.log('');
console.log('Note: If you encounter errors, you may need to execute migrations one by one.');