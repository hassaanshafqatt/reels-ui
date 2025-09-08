const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'reelcraft.db');
const db = new Database(dbPath);

console.log('🔧 FIXING DATABASE URL REFERENCES\n');

// Get all reel types with problematic URLs
const problematicTypes = db.prepare(`
  SELECT id, name, title, external_url 
  FROM reel_types 
  WHERE external_url LIKE '/api/reels/%' 
  AND external_url NOT LIKE '/api/reels/status%'
  AND external_url NOT LIKE '/api/reels/types%'
  AND external_url NOT LIKE '/api/reels/categories%'
`).all();

console.log(`Found ${problematicTypes.length} reel types with invalid URL references:`);
problematicTypes.forEach(type => {
  console.log(`  - ${type.name}: ${type.external_url}`);
});

console.log('\n🔄 Updating URLs to use local processing (external_url = NULL)...\n');

// Update these types to use local processing (NULL external_url)
const updateStmt = db.prepare(`
  UPDATE reel_types 
  SET external_url = NULL, updated_at = ?
  WHERE external_url LIKE '/api/reels/%' 
  AND external_url NOT LIKE '/api/reels/status%'
  AND external_url NOT LIKE '/api/reels/types%'
  AND external_url NOT LIKE '/api/reels/categories%'
`);

const result = updateStmt.run(new Date().toISOString());
console.log(`✅ Updated ${result.changes} reel types to use local processing`);

// Verify the changes
console.log('\n📊 UPDATED REEL TYPES CONFIGURATION:');
console.log('====================================');

const allTypes = db.prepare('SELECT name, title, external_url, is_active FROM reel_types ORDER BY name').all();

allTypes.forEach(type => {
  const status = type.is_active ? '✅ ACTIVE' : '❌ INACTIVE';
  const processing = type.external_url ? `🌐 EXTERNAL: ${type.external_url}` : '🏠 LOCAL PROCESSING';
  console.log(`${type.name}: ${type.title} [${status}] - ${processing}`);
});

console.log('\n🎯 SUMMARY:');
const localCount = allTypes.filter(t => !t.external_url).length;
const externalCount = allTypes.filter(t => t.external_url).length;
console.log(`Local processing: ${localCount} types`);
console.log(`External URLs: ${externalCount} types`);

db.close();
console.log('\n✅ Database URL fix complete!');
