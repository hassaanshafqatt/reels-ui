const Database = require('better-sqlite3');
const path = require('path');

// Connect to database
const dbPath = path.join(__dirname, 'data', 'reelcraft.db');
const db = new Database(dbPath);

// Check current schema
console.log('Current reel_types table schema:');
const tableInfo = db.prepare('PRAGMA table_info(reel_types)').all();
tableInfo.forEach(col => {
  console.log(`- ${col.name}: ${col.type} (nullable: ${col.notnull === 0})`);
});

// Check if we have sample data
console.log('\nCurrent reel types:');
const reelTypes = db.prepare('SELECT * FROM reel_types LIMIT 3').all();
reelTypes.forEach(type => {
  console.log(`- ${type.name}: caption_length=${type.caption_length}, include_author=${type.include_author}, min_caption_length=${type.min_caption_length}, max_caption_length=${type.max_caption_length}`);
});

db.close();