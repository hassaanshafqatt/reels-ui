const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'reelcraft.db');
const db = new Database(dbPath);

console.log('🔍 DATABASE AUDIT RESULTS\n');

// Check reel types and their URLs
const types = db.prepare('SELECT name, title, external_url, status_url, posting_url, is_active FROM reel_types ORDER BY name').all();

console.log('📊 REEL TYPES AND URL CONFIGURATION:');
console.log('=====================================');

types.forEach(type => {
  const status = type.is_active ? '✅ ACTIVE' : '❌ INACTIVE';
  console.log(`${type.name}: ${type.title} [${status}]`);
  console.log(`  External URL: ${type.external_url || '❌ NOT SET'}`);
  console.log(`  Status URL:   ${type.status_url || '❌ NOT SET'}`);
  console.log(`  Posting URL:  ${type.posting_url || '❌ NOT SET'}`);
  console.log('');
});

// Check for any hardcoded URLs still in use
console.log('🔗 URL ANALYSIS:');
console.log('================');

const externalUrls = types.filter(t => t.external_url).map(t => t.external_url);
const uniqueUrls = [...new Set(externalUrls)];

console.log(`Total reel types: ${types.length}`);
console.log(`Active reel types: ${types.filter(t => t.is_active).length}`);
console.log(`Types with external URLs: ${externalUrls.length}`);
console.log(`Unique external URLs: ${uniqueUrls.length}`);
console.log('');

console.log('🎯 UNIQUE EXTERNAL URLS:');
uniqueUrls.forEach(url => {
  const count = externalUrls.filter(u => u === url).length;
  console.log(`  ${url} (used by ${count} type${count > 1 ? 's' : ''})`);
});

db.close();
console.log('\n✅ Audit complete!');
