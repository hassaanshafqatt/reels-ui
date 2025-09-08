const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'reelcraft.db');
const db = new Database(dbPath);

console.log('🔍 CHECKING USER DATA\n');

// Check users
const users = db.prepare('SELECT id, email, name, plan FROM users').all();

console.log('📊 USERS IN DATABASE:');
console.log('=====================');

if (users.length === 0) {
  console.log('❌ No users found in database!');
} else {
  users.forEach(user => {
    console.log(`✅ ${user.email} (${user.name}) - Plan: ${user.plan}`);
  });
}

console.log('\n🔗 Try logging in with one of these credentials:');
users.forEach(user => {
  console.log(`Email: ${user.email}, Password: testpassword`);
});

db.close();
