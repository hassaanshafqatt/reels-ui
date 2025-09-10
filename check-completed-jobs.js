const Database = require('better-sqlite3');
const path = require('path');

// Initialize database
const dbPath = path.join(process.cwd(), 'data', 'reelcraft.db');
const db = new Database(dbPath);

// Query completed jobs
const completedJobs = db.prepare(`
  SELECT job_id, status, result_url, caption, created_at, updated_at
  FROM jobs 
  WHERE status = 'completed'
  ORDER BY updated_at DESC
  LIMIT 5
`).all();

console.log('Recent completed jobs:');
console.log(JSON.stringify(completedJobs, null, 2));

db.close();
