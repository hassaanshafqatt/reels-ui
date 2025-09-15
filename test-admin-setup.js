const Database = require('better-sqlite3');
const db = new Database('./data/reelcraft.db');

console.log('=== Testing Admin Functionality ===\n');

// Check current users
const users = db.prepare('SELECT id, email, name, is_admin FROM users').all();
console.log('Current users:');
users.forEach(user => {
  console.log(`- ${user.name} (${user.email}): Admin=${user.is_admin ? 'Yes' : 'No'}`);
});

// Make hassaanshafqatt@outlook.com an admin for testing
const userId = '5fa46ef7-b7eb-47a4-ae1d-dbcfff9bd301';
const updateStmt = db.prepare('UPDATE users SET is_admin = 1 WHERE id = ?');
const result = updateStmt.run(userId);

console.log('\n=== Updated Admin Status ===');
console.log(`Updated ${result.changes} user(s)`);

// Check users again
const updatedUsers = db.prepare('SELECT id, email, name, is_admin FROM users').all();
console.log('\nUpdated users:');
updatedUsers.forEach(user => {
  console.log(`- ${user.name} (${user.email}): Admin=${user.is_admin ? 'Yes' : 'No'}`);
});

db.close();
console.log('\nAdmin setup completed!');