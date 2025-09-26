import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true, mode: 0o755 });
}

// Initialize database
const dbPath = path.join(dataDir, 'reelcraft.db');

// Check if we can write to the directory
try {
  fs.accessSync(dataDir, fs.constants.W_OK);
} catch {
  // Directory is not writable, but continue anyway
}

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// User interface
export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  is_admin: boolean;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

interface Job {
  id: string;
  user_id: string;
  job_id: string;
  category: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'approved' | 'posted' | 'rejected';
  result_url?: string;
  caption?: string;
  error_message?: string;
  failure_count?: number;
  poll_count?: number;
  last_status?: string;
  created_at: string;
  updated_at: string;
}

interface ReelType {
  id: string;
  category_id: string;
  name: string;
  title: string;
  description: string;
  icon: string;
  message: string;
  caption: string;
  min_caption_length: number;
  max_caption_length: number;
  include_author: boolean;
  allow_custom_audio: boolean;
  external_url?: string;
  status_url?: string;
  posting_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Optional per-type UI label overrides
  label_caption_title?: string;
  label_caption_description?: string;
  label_caption_field?: string;
  label_caption_placeholder?: string;
  label_caption_toggle_auto?: string;
  label_caption_toggle_auto_sub?: string;
  label_caption_toggle_custom?: string;
  label_caption_toggle_custom_sub?: string;
}

interface ReelCategory {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Create users table
const createUsersTable = () => {
  const stmt = db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
      is_admin BOOLEAN DEFAULT 0,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  stmt.run();
};

// Create sessions table for token management
const createSessionsTable = () => {
  const stmt = db.prepare(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);
  stmt.run();
};

// Create jobs table for storing user jobs
const createJobsTable = () => {
  const stmt = db.prepare(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      job_id TEXT NOT NULL,
      category TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'approved', 'posted', 'rejected')),
      result_url TEXT,
      caption TEXT,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);
  stmt.run();
};

// Create reel categories table
const createReelCategoriesTable = () => {
  const stmt = db.prepare(`
    CREATE TABLE IF NOT EXISTS reel_categories (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  stmt.run();
};

// Create reel types table
const createReelTypesTable = () => {
  const stmt = db.prepare(`
    CREATE TABLE IF NOT EXISTS reel_types (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      name TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      message TEXT NOT NULL,
      caption TEXT NOT NULL,
      min_caption_length INTEGER DEFAULT 10,
      max_caption_length INTEGER DEFAULT 100,
      include_author BOOLEAN DEFAULT 1,
      allow_custom_audio BOOLEAN DEFAULT 1,
      external_url TEXT,
      -- Per-type UI label overrides
      label_caption_title TEXT,
      label_caption_description TEXT,
      label_caption_field TEXT,
      label_caption_placeholder TEXT,
      label_caption_toggle_auto TEXT,
      label_caption_toggle_auto_sub TEXT,
      label_caption_toggle_custom TEXT,
      label_caption_toggle_custom_sub TEXT,
      status_url TEXT,
      posting_url TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES reel_categories (id) ON DELETE CASCADE,
      UNIQUE(category_id, name)
    )
  `);
  stmt.run();
};

// Create admin settings table
const createAdminSettingsTable = () => {
  const stmt = db.prepare(`
    CREATE TABLE IF NOT EXISTS admin_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  stmt.run();

  // Insert default settings if they don't exist
  const defaultSettings = [
    {
      key: 'global_polling_enabled',
      value: 'true',
      description: 'Enable or disable global job status polling'
    },
    {
      key: 'default_min_caption_length',
      value: '10',
      description: 'Default minimum length for reel captions in characters'
    },
    {
      key: 'default_max_caption_length',
      value: '100',
      description: 'Default maximum length for reel captions in characters'
    },
    {
      key: 'include_author_by_default',
      value: 'true',
      description: 'Whether to include author information in reels by default'
    },
    {
      key: 'allow_custom_audio_globally',
      value: 'true',
      description: 'If false, disables custom audio uploads for all reel types'
    }
  ];

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO admin_settings (key, value, description)
    VALUES (?, ?, ?)
  `);

  for (const setting of defaultSettings) {
    insertStmt.run(setting.key, setting.value, setting.description);
  }
};

// Initialize tables
createUsersTable();
createSessionsTable();
createJobsTable();
createReelCategoriesTable();
createReelTypesTable();
createAdminSettingsTable();

// User operations
export const userOperations = {
  // Create a new user
  create: (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) => {
    const id = crypto.randomUUID();
    const stmt = db.prepare(`
      INSERT INTO users (id, email, password_hash, name, plan, is_admin, avatar)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    try {
      stmt.run(id, userData.email, userData.password_hash, userData.name, userData.plan, userData.is_admin ? 1 : 0, userData.avatar);
      return { success: true, userId: id };
    } catch {
      return { success: false, error: 'Failed to create user' };
    }
  },

  // Find user by email
  findByEmail: (email: string): User | null => {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) as User | null;
  },

  // Find user by ID
  findById: (id: string): User | null => {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | null;
  },

  // Update user
  update: (id: string, userData: Partial<Omit<User, 'id' | 'created_at'>>) => {
    const fields = Object.keys(userData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(userData);
    
    const stmt = db.prepare(`
      UPDATE users 
      SET ${fields}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    
    try {
      stmt.run(...values, id);
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to update user' };
    }
  },

  // Delete user
  delete: (id: string) => {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    try {
      stmt.run(id);
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to delete user' };
    }
  },

  // Get all users (admin only)
  getAll: () => {
    const stmt = db.prepare('SELECT id, email, name, plan, is_admin, created_at, updated_at FROM users ORDER BY created_at DESC');
    return stmt.all() as Omit<User, 'password_hash'>[];
  },

  // Update admin status
  updateAdminStatus: (id: string, isAdmin: boolean) => {
    const stmt = db.prepare('UPDATE users SET is_admin = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    try {
      const result = stmt.run(isAdmin ? 1 : 0, id);
      return { success: result.changes > 0 };
    } catch {
      return { success: false, error: 'Failed to update admin status' };
    }
  }
};

// Session operations
export const sessionOperations = {
  // Create session
  create: (userId: string, token: string, expiresAt: Date) => {
    const id = crypto.randomUUID();
    const stmt = db.prepare(`
      INSERT INTO sessions (id, user_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `);
    
    try {
      const isoString = expiresAt.toISOString();
      stmt.run(id, userId, token, isoString);
      return { success: true, sessionId: id };
    } catch {
      return { success: false, error: `Failed to create session` };
    }
  },

  // Find session by token
  findByToken: (token: string) => {
    const stmt = db.prepare(`
      SELECT s.*, u.id as user_id, u.email, u.name, u.plan, u.avatar, u.created_at as user_created_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND s.expires_at > datetime('now')
    `);
    return stmt.get(token) as Record<string, unknown> | undefined;
  },

  // Delete session
  delete: (token: string) => {
    const stmt = db.prepare('DELETE FROM sessions WHERE token = ?');
    stmt.run(token);
  },

  // Clean expired sessions
  cleanExpired: () => {
    const stmt = db.prepare('DELETE FROM sessions WHERE expires_at <= datetime(\'now\')');
    stmt.run();
  }
};

// Job operations
export const jobOperations = {
  // Create a new job for a user
  create: (userId: string, jobData: { jobId: string; category: string; type: string }) => {
    const id = crypto.randomUUID();
    const stmt = db.prepare(`
      INSERT INTO jobs (id, user_id, job_id, category, type, failure_count, poll_count, last_status)
      VALUES (?, ?, ?, ?, ?, 0, 0, 'pending')
    `);
    
    try {
      stmt.run(id, userId, jobData.jobId, jobData.category, jobData.type);
      return id;
    } catch {
      throw new Error('Failed to create job');
    }
  },

  // Get jobs for a user
  getByUserId: (userId: string, limit = 50): Job[] => {
    const stmt = db.prepare(`
      SELECT * FROM jobs 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    return stmt.all(userId, limit) as Job[];
  },

  // Update job status
  updateStatus: (jobId: string, status: string, resultUrl?: string, errorMessage?: string, caption?: string) => {
    const stmt = db.prepare(`
      UPDATE jobs 
      SET status = ?, result_url = ?, error_message = ?, caption = ?, updated_at = CURRENT_TIMESTAMP
      WHERE job_id = ?
    `);
    stmt.run(status, resultUrl || null, errorMessage || null, caption || null, jobId);
  },

  // Update job status with failure tracking
  updateStatusWithFailureTracking: (jobId: string, status: string, resultUrl?: string, errorMessage?: string, caption?: string) => {
    // Get current job to check failure count
    const currentJob = db.prepare('SELECT failure_count, status FROM jobs WHERE job_id = ?').get(jobId) as { failure_count: number; status: string } | undefined;
    const currentFailureCount = currentJob?.failure_count || 0;
    
    let newFailureCount = 0;
    let finalStatus = status;
    
    if (status === 'failed' || errorMessage) {
      // Increment failure count
      newFailureCount = currentFailureCount + 1;
      
      // Only set to failed if we've had 10 consecutive failures
      if (newFailureCount < 10) {
        // Keep the current status (probably 'pending' or 'processing')
        finalStatus = currentJob?.status || 'pending';
      } else {
        // 10 failures reached, set to failed
        finalStatus = 'failed';
      }
    } else {
      // Success status, reset failure count
      newFailureCount = 0;
    }
    
    const stmt = db.prepare(`
      UPDATE jobs 
      SET status = ?, result_url = ?, error_message = ?, caption = ?, failure_count = ?, updated_at = CURRENT_TIMESTAMP
      WHERE job_id = ?
    `);
    stmt.run(finalStatus, resultUrl || null, errorMessage || null, caption || null, newFailureCount, jobId);
    
    return { status: finalStatus, failureCount: newFailureCount };
  },

  // Update job status with poll count tracking
  updateStatusWithPollTracking: (jobId: string, status: string, resultUrl?: string, errorMessage?: string, caption?: string) => {
    // Get current job to check poll count and last status
    const currentJob = db.prepare('SELECT poll_count, last_status, failure_count, status FROM jobs WHERE job_id = ?').get(jobId) as { poll_count: number; last_status: string; failure_count: number; status: string } | undefined;
    
    if (!currentJob) {
      return { status: 'failed', pollCount: 0, shouldStopPolling: true };
    }
    
    const currentPollCount = currentJob.poll_count || 0;
    const lastStatus = currentJob.last_status;
    let newPollCount = currentPollCount;
    let shouldStopPolling = false;
    
    // Check if status has changed from last poll
    if (lastStatus === status) {
      // Status hasn't changed, increment poll count
      newPollCount = currentPollCount + 1;
      
      // Stop polling if we've checked the same status 50 times
      if (newPollCount >= 50) {
        shouldStopPolling = true;
      }
    } else {
      // Status changed, reset poll count
      newPollCount = 1;
    }
    
    // Handle failure tracking as well
    let finalStatus = status;
    let newFailureCount = currentJob.failure_count || 0;
    
    if (status === 'failed' || errorMessage) {
      // Increment failure count
      newFailureCount = newFailureCount + 1;
      
      // Only set to failed if we've had 10 consecutive failures
      if (newFailureCount < 10) {
        // Keep the current status (probably 'pending' or 'processing')
        finalStatus = currentJob.status || 'pending';
      } else {
        // 10 failures reached, set to failed
        finalStatus = 'failed';
        shouldStopPolling = true;
      }
    } else if (status === 'completed' || status === 'posted') {
      // Success status, reset failure count and stop polling
      newFailureCount = 0;
      shouldStopPolling = true;
    } else {
      // Other statuses, reset failure count
      newFailureCount = 0;
    }
    
    const stmt = db.prepare(`
      UPDATE jobs 
      SET status = ?, result_url = ?, error_message = ?, caption = ?, failure_count = ?, poll_count = ?, last_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE job_id = ?
    `);
    stmt.run(finalStatus, resultUrl || null, errorMessage || null, caption || null, newFailureCount, newPollCount, status, jobId);
    
    return { 
      status: finalStatus, 
      pollCount: newPollCount, 
      failureCount: newFailureCount,
      shouldStopPolling 
    };
  },

  // Get job by job_id
  getByJobId: (jobId: string): Job | undefined => {
    const stmt = db.prepare('SELECT * FROM jobs WHERE job_id = ?');
    return stmt.get(jobId) as Job | undefined;
  },

  // Delete old jobs (keep only last 100 per user)
  cleanOldJobs: (userId: string) => {
    const stmt = db.prepare(`
      DELETE FROM jobs 
      WHERE user_id = ? AND id NOT IN (
        SELECT id FROM jobs 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT 100
      )
    `);
    stmt.run(userId, userId);
  },

  // Clear all jobs for a user
  clearAllByUserId: (userId: string): number => {
    const stmt = db.prepare('DELETE FROM jobs WHERE user_id = ?');
    const result = stmt.run(userId);
    return result.changes;
  },

  // Clear jobs for a user by category
  clearByCategoryAndUserId: (category: string, userId: string): number => {
    const stmt = db.prepare('DELETE FROM jobs WHERE user_id = ? AND category = ?');
    const result = stmt.run(userId, category);
    return result.changes;
  }
};

// Password utilities
export const passwordUtils = {
  hash: async (password: string): Promise<string> => {
    return await bcrypt.hash(password, 12);
  },

  verify: async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
  }
};

// Reel category operations
export const reelCategoryOperations = {
  // Create a new category
  create: (categoryData: Omit<ReelCategory, 'id' | 'created_at' | 'updated_at'>) => {
    const id = crypto.randomUUID();
    const stmt = db.prepare(`
      INSERT INTO reel_categories (id, name, title, description, icon, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, categoryData.name, categoryData.title, categoryData.description, categoryData.icon, categoryData.is_active ? 1 : 0);
    return id;
  },

  // Get all categories
  getAll: (activeOnly = false): ReelCategory[] => {
    const whereClause = activeOnly ? 'WHERE is_active = 1' : '';
    const stmt = db.prepare(`SELECT * FROM reel_categories ${whereClause} ORDER BY title`);
    return stmt.all() as ReelCategory[];
  },

  // Get category by id
  getById: (id: string): ReelCategory | null => {
    const stmt = db.prepare('SELECT * FROM reel_categories WHERE id = ?');
    return stmt.get(id) as ReelCategory | null;
  },

  // Update category
  update: (id: string, updates: Partial<Omit<ReelCategory, 'id' | 'created_at' | 'updated_at'>>) => {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates).map(value => 
      typeof value === 'boolean' ? (value ? 1 : 0) : value
    );
    const stmt = db.prepare(`
      UPDATE reel_categories 
      SET ${fields}, updated_at = ?
      WHERE id = ?
    `);
    return stmt.run(...values, new Date().toISOString(), id).changes > 0;
  },

  // Delete category
  delete: (id: string) => {
    const stmt = db.prepare('DELETE FROM reel_categories WHERE id = ?');
    return stmt.run(id).changes > 0;
  }
};

// Helper function to convert database boolean fields to actual booleans
const convertReelTypeBooleans = (row: unknown): ReelType => {
  const data = row as Record<string, unknown>;

  // Helper to coerce DB values which may be 0/1, '0'/'1', true/false, or null
  const toBoolean = (val: unknown, defaultValue = true): boolean => {
    if (val === undefined || val === null) return defaultValue;
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val !== 0;
    if (typeof val === 'string') return val === '1' || val.toLowerCase() === 'true';
    return Boolean(val);
  };

  return {
    // Copy known fields explicitly to keep types accurate
    id: String(data.id),
    category_id: String(data.category_id),
    name: String(data.name),
    title: String(data.title),
    description: String(data.description),
    icon: String(data.icon),
    message: String(data.message),
    caption: String(data.caption),
    min_caption_length: Number(data.min_caption_length) || 10,
    max_caption_length: Number(data.max_caption_length) || 100,
    include_author: toBoolean(data.include_author, true),
    allow_custom_audio: toBoolean(data.allow_custom_audio, true),
    external_url: data.external_url ? String(data.external_url) : undefined,
    status_url: data.status_url ? String(data.status_url) : undefined,
    posting_url: data.posting_url ? String(data.posting_url) : undefined,
    is_active: toBoolean(data.is_active, true),
    created_at: String(data.created_at),
    updated_at: String(data.updated_at),
    // Optional per-type UI label overrides
    label_caption_title: data.label_caption_title ? String(data.label_caption_title) : undefined,
    label_caption_description: data.label_caption_description ? String(data.label_caption_description) : undefined,
    label_caption_field: data.label_caption_field ? String(data.label_caption_field) : undefined,
    label_caption_placeholder: data.label_caption_placeholder ? String(data.label_caption_placeholder) : undefined,
    label_caption_toggle_auto: data.label_caption_toggle_auto ? String(data.label_caption_toggle_auto) : undefined,
    label_caption_toggle_auto_sub: data.label_caption_toggle_auto_sub ? String(data.label_caption_toggle_auto_sub) : undefined,
    label_caption_toggle_custom: data.label_caption_toggle_custom ? String(data.label_caption_toggle_custom) : undefined,
    label_caption_toggle_custom_sub: data.label_caption_toggle_custom_sub ? String(data.label_caption_toggle_custom_sub) : undefined,
  } as ReelType;
};

// Reel type operations
export const reelTypeOperations = {
  // Create a new reel type
  create: (typeData: Omit<ReelType, 'id' | 'created_at' | 'updated_at'>) => {
    const id = crypto.randomUUID();
    const stmt = db.prepare(`
      INSERT INTO reel_types (id, category_id, name, title, description, icon, message, caption, min_caption_length, max_caption_length, include_author, allow_custom_audio, external_url,
        label_caption_title, label_caption_description, label_caption_field, label_caption_placeholder, label_caption_toggle_auto, label_caption_toggle_auto_sub, label_caption_toggle_custom, label_caption_toggle_custom_sub,
        status_url, posting_url, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      typeData.category_id,
      typeData.name,
      typeData.title,
      typeData.description,
      typeData.icon,
      typeData.message,
      typeData.caption,
      typeData.min_caption_length || 10,
      typeData.max_caption_length || 100,
      typeData.include_author ? 1 : 0,
      typeData.allow_custom_audio === false ? 0 : 1,
      typeData.external_url,
      typeData.label_caption_title || null,
      typeData.label_caption_description || null,
      typeData.label_caption_field || null,
      typeData.label_caption_placeholder || null,
      typeData.label_caption_toggle_auto || null,
      typeData.label_caption_toggle_auto_sub || null,
      typeData.label_caption_toggle_custom || null,
      typeData.label_caption_toggle_custom_sub || null,
      typeData.status_url,
      typeData.posting_url,
      typeData.is_active ? 1 : 0
    );
    return id;
  },

  // Get all reel types
  getAll: (activeOnly = false): ReelType[] => {
    const whereClause = activeOnly ? 'WHERE rt.is_active = 1' : '';
    const stmt = db.prepare(`
      SELECT rt.*, rc.name as category_name, rc.title as category_title 
      FROM reel_types rt
      JOIN reel_categories rc ON rt.category_id = rc.id
      ${whereClause}
      ORDER BY rc.title, rt.title
    `);
    const rows = stmt.all();
    return rows.map(convertReelTypeBooleans);
  },

  // Get reel types by category
  getByCategory: (categoryId: string, activeOnly = false): ReelType[] => {
    const whereClause = activeOnly ? 'AND is_active = 1' : '';
    const stmt = db.prepare(`
      SELECT * FROM reel_types 
      WHERE category_id = ? ${whereClause}
      ORDER BY title
    `);
    const rows = stmt.all(categoryId);
    return rows.map(convertReelTypeBooleans);
  },

  // Get reel type by id
  getById: (id: string): ReelType | null => {
    const stmt = db.prepare('SELECT * FROM reel_types WHERE id = ?');
    const row = stmt.get(id);
    return row ? convertReelTypeBooleans(row) : null;
  },

  // Get reel type by name and category
  getByName: (name: string, categoryId: string): ReelType | null => {
    const stmt = db.prepare('SELECT * FROM reel_types WHERE name = ? AND category_id = ?');
    const row = stmt.get(name, categoryId);
    return row ? convertReelTypeBooleans(row) : null;
  },

  // Get reel type by name only (across all categories)
  getByNameOnly: (name: string): ReelType | null => {
    const stmt = db.prepare('SELECT * FROM reel_types WHERE name = ? LIMIT 1');
    const row = stmt.get(name);
    return row ? convertReelTypeBooleans(row) : null;
  },

  // Update reel type
  update: (id: string, updates: Partial<Omit<ReelType, 'id' | 'created_at' | 'updated_at'>>) => {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates).map(value => 
      typeof value === 'boolean' ? (value ? 1 : 0) : value
    );
    const stmt = db.prepare(`
      UPDATE reel_types 
      SET ${fields}, updated_at = ?
      WHERE id = ?
    `);
    return stmt.run(...values, new Date().toISOString(), id).changes > 0;
  },

  // Delete reel type
  delete: (id: string) => {
    const stmt = db.prepare('DELETE FROM reel_types WHERE id = ?');
    return stmt.run(id).changes > 0;
  }
};

// Admin settings operations
export const adminSettingsOperations = {
  // Get a setting by key
  get: (key: string) => {
    const stmt = db.prepare('SELECT * FROM admin_settings WHERE key = ?');
    const result = stmt.get(key) as { key: string; value: string; description?: string; updated_at: string } | null;
    return result;
  },

  // Get all settings
  getAll: () => {
    const stmt = db.prepare('SELECT * FROM admin_settings ORDER BY key');
    return stmt.all() as { key: string; value: string; description?: string; updated_at: string }[];
  },

  // Set a setting value
  set: (key: string, value: string, description?: string) => {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO admin_settings (key, value, description, updated_at)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(key, value, description || null, new Date().toISOString()).changes > 0;
  },

  // Get setting value as boolean
  getBoolean: (key: string, defaultValue: boolean = false) => {
    const setting = adminSettingsOperations.get(key);
    if (!setting) return defaultValue;
    return setting.value.toLowerCase() === 'true';
  },

  // Set boolean setting
  setBoolean: (key: string, value: boolean, description?: string) => {
    return adminSettingsOperations.set(key, value.toString(), description);
  },

  // Delete a setting
  delete: (key: string) => {
    const stmt = db.prepare('DELETE FROM admin_settings WHERE key = ?');
    return stmt.run(key).changes > 0;
  }
};

// Migration function to add caption column to jobs table
export const migrateCaptionColumn = () => {
  try {
    // Check if caption column already exists
    const columnInfo = db.prepare("PRAGMA table_info(jobs)").all() as { name: string }[];
    const captionExists = columnInfo.some((col) => col.name === 'caption');
    
    if (!captionExists) {
      db.prepare('ALTER TABLE jobs ADD COLUMN caption TEXT').run();
    }
    
  } catch {
    // Migration error handled silently
  }
};

// Migration function to add caption_length and include_author columns to reel_types table
export const migrateReelTypesCaptionSettings = () => {
  try {
    // Check if columns already exist
    const columnInfo = db.prepare("PRAGMA table_info(reel_types)").all() as { name: string }[];
    const captionLengthExists = columnInfo.some((col) => col.name === 'caption_length');
    const includeAuthorExists = columnInfo.some((col) => col.name === 'include_author');
    
    if (!captionLengthExists) {
      db.prepare('ALTER TABLE reel_types ADD COLUMN caption_length INTEGER DEFAULT 100').run();
    }
    
    if (!includeAuthorExists) {
      db.prepare('ALTER TABLE reel_types ADD COLUMN include_author BOOLEAN DEFAULT 1').run();
    }
    
  } catch {
    // Migration error handled silently
  }
};

// Migration function to add min/max caption length columns to reel_types table
export const migrateMinMaxCaptionLength = () => {
  try {
    // Check if columns already exist
    const columnInfo = db.prepare("PRAGMA table_info(reel_types)").all() as { name: string }[];
    const minCaptionLengthExists = columnInfo.some((col) => col.name === 'min_caption_length');
    const maxCaptionLengthExists = columnInfo.some((col) => col.name === 'max_caption_length');
    const oldCaptionLengthExists = columnInfo.some((col) => col.name === 'caption_length');
    
    if (!minCaptionLengthExists) {
      db.prepare('ALTER TABLE reel_types ADD COLUMN min_caption_length INTEGER DEFAULT 10').run();
    }
    
    if (!maxCaptionLengthExists) {
      
      // If old caption_length exists, use its value as max_caption_length default
      if (oldCaptionLengthExists) {
        db.prepare('ALTER TABLE reel_types ADD COLUMN max_caption_length INTEGER').run();
        db.prepare('UPDATE reel_types SET max_caption_length = COALESCE(caption_length, 100)').run();
      } else {
        db.prepare('ALTER TABLE reel_types ADD COLUMN max_caption_length INTEGER DEFAULT 100').run();
      }
    }
    
  } catch {
    // Migration error handled silently
  }
};

// Migration function to add allow_custom_audio column to reel_types table
export const migrateAllowCustomAudio = () => {
  try {
    const columnInfo = db.prepare("PRAGMA table_info(reel_types)").all() as { name: string }[];
    const allowCustomAudioExists = columnInfo.some((col) => col.name === 'allow_custom_audio');
    if (!allowCustomAudioExists) {
      db.prepare('ALTER TABLE reel_types ADD COLUMN allow_custom_audio BOOLEAN DEFAULT 1').run();
      db.prepare('UPDATE reel_types SET allow_custom_audio = 1 WHERE allow_custom_audio IS NULL').run();
    }
  } catch {
    // Migration error handled silently
  }
};

// Migration to add per-type label columns to reel_types if missing
export const migrateReelTypeLabels = () => {
  try {
    const columnInfo = db.prepare("PRAGMA table_info(reel_types)").all() as { name: string }[];
    const cols = columnInfo.map(c => c.name);

    const addIfMissing = (col: string, definition: string) => {
      if (!cols.includes(col)) {
        db.prepare(`ALTER TABLE reel_types ADD COLUMN ${col} ${definition}`).run();
      }
    };

    addIfMissing('label_caption_title', 'TEXT');
    addIfMissing('label_caption_description', 'TEXT');
    addIfMissing('label_caption_field', 'TEXT');
    addIfMissing('label_caption_placeholder', 'TEXT');
    addIfMissing('label_caption_toggle_auto', 'TEXT');
    addIfMissing('label_caption_toggle_auto_sub', 'TEXT');
    addIfMissing('label_caption_toggle_custom', 'TEXT');
    addIfMissing('label_caption_toggle_custom_sub', 'TEXT');
  } catch {
    // silently ignore migration errors
  }
};

// Migration function to update status constraint to include new status values
export const migrateStatusConstraint = () => {
  try {
    
    // SQLite doesn't support ALTER TABLE to modify constraints directly
    // We need to recreate the table with the new constraint
    
    // First, create a backup table with the new structure
    db.prepare(`
      CREATE TABLE IF NOT EXISTS jobs_new (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        job_id TEXT NOT NULL,
        category TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'approved', 'posted', 'rejected')),
        result_url TEXT,
        caption TEXT,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `).run();
    
    // Copy data from old table to new table
    db.prepare(`
      INSERT INTO jobs_new (id, user_id, job_id, category, type, status, result_url, caption, error_message, created_at, updated_at)
      SELECT id, user_id, job_id, category, type, status, result_url, caption, error_message, created_at, updated_at
      FROM jobs
    `).run();
    
    // Drop the old table
    db.prepare('DROP TABLE jobs').run();
    
    // Rename the new table to the original name
    db.prepare('ALTER TABLE jobs_new RENAME TO jobs').run();
    
  } catch {
    // If migration fails, we should continue without crashing
  }
};

// Migration function to add polling control columns to jobs table
export const migratePollCountColumns = () => {
  try {
    // Check if polling columns already exist
    const columnInfo = db.prepare("PRAGMA table_info(jobs)").all() as { name: string }[];
    const failureCountExists = columnInfo.some((col) => col.name === 'failure_count');
    const pollCountExists = columnInfo.some((col) => col.name === 'poll_count');
    const lastStatusExists = columnInfo.some((col) => col.name === 'last_status');
    
    if (!failureCountExists) {
      db.prepare('ALTER TABLE jobs ADD COLUMN failure_count INTEGER DEFAULT 0').run();
      // Update existing rows to have default value
      db.prepare('UPDATE jobs SET failure_count = 0 WHERE failure_count IS NULL').run();
    }
    
    if (!pollCountExists) {
      db.prepare('ALTER TABLE jobs ADD COLUMN poll_count INTEGER DEFAULT 0').run();
      // Update existing rows to have default value
      db.prepare('UPDATE jobs SET poll_count = 0 WHERE poll_count IS NULL').run();
    }
    
    if (!lastStatusExists) {
      db.prepare('ALTER TABLE jobs ADD COLUMN last_status TEXT').run();
      // Update existing rows to have their current status as last_status
      db.prepare('UPDATE jobs SET last_status = status WHERE last_status IS NULL').run();
    }
    
  } catch {
    // Migration error handled silently
  }
};

// Migration function to add admin role column to users table
export const migrateAdminRole = () => {
  try {
    // Check if is_admin column already exists
    const columnInfo = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
    const isAdminExists = columnInfo.some((col) => col.name === 'is_admin');
    
    if (!isAdminExists) {
      db.prepare('ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0').run();
      // Update existing rows to have default value
      db.prepare('UPDATE users SET is_admin = 0 WHERE is_admin IS NULL').run();
      
      // Make the demo user an admin if it exists
      const demoUser = userOperations.findByEmail('demo@reelcraft.com');
      if (demoUser) {
        db.prepare('UPDATE users SET is_admin = 1 WHERE email = ?').run('demo@reelcraft.com');
      }
    }
    
  } catch {
    // Migration error handled silently
  }
};

// Migration function to populate database with initial reel configurations
export const migrateInitialReelData = () => {
  const categories = [
    {
      name: 'viral',
      title: 'Viral Reels',
      description: 'High-engagement motivational content',
      icon: 'Zap',
      is_active: true
    },
    {
      name: 'proverbs',
      title: 'Proverbs Viral Reels',
      description: 'Wisdom-based content with deep meaning',
      icon: 'Brain',
      is_active: true
    },
    {
      name: 'anime',
      title: 'Anime Style Reels',
      description: 'Anime-inspired creative content',
      icon: 'Palette',
      is_active: true
    },
    {
      name: 'asmr',
      title: 'ASMR Reels',
      description: 'Relaxing and satisfying content',
      icon: 'Music',
      is_active: true
    }
  ];

  const types = [
    // Viral category types
    {
      category_name: 'viral',
      name: 'gym-motivation',
      title: 'Gym Motivation',
      description: 'Motivational content for fitness enthusiasts',
      icon: 'Dumbbell',
      message: 'Generate gym motivation reel',
      caption: 'Get pumped and motivated to hit the gym!',
      external_url: '/api/reels/gym-motivation',
      status_url: '/api/reels/status',
      posting_url: '/api/reels/post',
      is_active: true
    },
    {
      category_name: 'viral',
      name: 'war-motivation',
      title: 'War Motivation/Wisdom',
      description: 'Strategic and motivational war-themed content',
      icon: 'Sword',
      message: 'Generate war motivation reel',
      caption: 'Ancient wisdom meets modern motivation',
      external_url: '/api/reels/war-motivation',
      status_url: '/api/reels/status',
      posting_url: '/api/reels/post',
      is_active: true
    },
    {
      category_name: 'viral',
      name: 'medieval-war',
      title: 'Medieval War Motivation',
      description: 'Medieval-themed motivational content',
      icon: 'Shield',
      message: 'Generate medieval war motivation reel',
      caption: 'Honor, courage, and medieval wisdom',
      external_url: '/api/reels/medieval-war',
      status_url: '/api/reels/status',
      posting_url: '/api/reels/post',
      is_active: true
    },
    {
      category_name: 'viral',
      name: 'gangsters',
      title: '1920s Gangsters',
      description: 'Prohibition era gangster-themed content',
      icon: 'Crown',
      message: 'Generate 1920s gangster reel',
      caption: 'Class, style, and 1920s wisdom',
      external_url: '/api/reels/gangsters',
      status_url: '/api/reels/status',
      posting_url: '/api/reels/post',
      is_active: true
    },
    // Proverbs category types
    {
      category_name: 'proverbs',
      name: 'wisdom',
      title: 'Wisdom',
      description: 'Timeless wisdom and life lessons',
      icon: 'Brain',
      message: 'Generate wisdom reel',
      caption: 'Ancient wisdom for modern times',
      external_url: '/api/reels/wisdom',
      status_url: '/api/reels/status',
      posting_url: '/api/reels/post',
      is_active: true
    },
    {
      category_name: 'proverbs',
      name: 'motivation',
      title: 'Motivation',
      description: 'Inspirational and motivational content',
      icon: 'Zap',
      message: 'Generate motivation reel',
      caption: 'Find your inner strength and motivation',
      external_url: '/api/reels/motivation',
      status_url: '/api/reels/status',
      posting_url: '/api/reels/post',
      is_active: true
    },
    {
      category_name: 'proverbs',
      name: 'brotherhood',
      title: 'Brotherhood',
      description: 'Content about loyalty, friendship, and bonds',
      icon: 'HandHeart',
      message: 'Generate brotherhood reel',
      caption: 'The bonds that make us stronger',
      external_url: '/api/reels/brotherhood',
      status_url: '/api/reels/status',
      posting_url: '/api/reels/post',
      is_active: true
    },
    {
      category_name: 'proverbs',
      name: 'bravery',
      title: 'Bravery',
      description: 'Courage and bravery-themed content',
      icon: 'Heart',
      message: 'Generate bravery reel',
      caption: 'Courage in the face of adversity',
      external_url: '/api/reels/bravery',
      status_url: '/api/reels/status',
      posting_url: '/api/reels/post',
      is_active: true
    },
    // Anime category types
    {
      category_name: 'anime',
      name: 'theory',
      title: 'Theory',
      description: 'Anime theories and deep analysis',
      icon: 'Lightbulb',
      message: 'Generate anime theory reel',
      caption: 'Dive deep into anime mysteries',
      external_url: '/api/reels/theory',
      status_url: '/api/reels/status',
      posting_url: '/api/reels/post',
      is_active: true
    },
    {
      category_name: 'anime',
      name: 'painting',
      title: 'Painting',
      description: 'Anime-style painting and art content',
      icon: 'PaintBucket',
      message: 'Generate anime painting reel',
      caption: 'Beautiful anime art comes to life',
      external_url: '/api/reels/anime-painting',
      status_url: '/api/reels/status',
      posting_url: '/api/reels/post',
      is_active: true
    },
    // ASMR category types
    {
      category_name: 'asmr',
      name: 'food',
      title: 'Food',
      description: 'Satisfying food ASMR content',
      icon: 'Utensils',
      message: 'Generate food ASMR reel',
      caption: 'Satisfying food moments',
      external_url: '/api/reels/asmr-food',
      status_url: '/api/reels/status',
      posting_url: '/api/reels/post',
      is_active: true
    },
    {
      category_name: 'asmr',
      name: 'animal',
      title: 'Animal',
      description: 'Cute and relaxing animal ASMR content',
      icon: 'PawPrint',
      message: 'Generate animal ASMR reel',
      caption: 'Adorable animals bring peace',
      external_url: '/api/reels/asmr-animal',
      status_url: '/api/reels/status',
      posting_url: '/api/reels/post',
      is_active: true
    }
  ];

  // Insert categories first
  const categoryMap: Record<string, string> = {};
  for (const category of categories) {
    const existingCategory = reelCategoryOperations.getAll().find(c => c.name === category.name);
    if (!existingCategory) {
      const categoryId = reelCategoryOperations.create(category);
      categoryMap[category.name] = categoryId;
    } else {
      categoryMap[category.name] = existingCategory.id;
    }
  }

  // Insert types
  for (const type of types) {
    const { category_name, ...typeData } = type;
    const categoryId = categoryMap[category_name];
    if (!categoryId) {
      continue;
    }

    const existingType = reelTypeOperations.getByName(type.name, categoryId);
    if (!existingType) {
      reelTypeOperations.create({
        ...typeData,
        category_id: categoryId,
        min_caption_length: 10,
        max_caption_length: 100,
        include_author: true,
        allow_custom_audio: true
      });
    }
  }

};

// Initialize with some demo data if empty
const initializeDemoData = async () => {
  const existingUser = userOperations.findByEmail('demo@reelcraft.com');
  if (!existingUser) {
    const hashedPassword = await passwordUtils.hash('password123');
    userOperations.create({
      email: 'demo@reelcraft.com',
      password_hash: hashedPassword,
      name: 'Demo User',
      plan: 'pro',
      is_admin: true
    });

    const hashedPassword2 = await passwordUtils.hash('test123');
    userOperations.create({
      email: 'test@example.com',
      password_hash: hashedPassword2,
      name: 'Test User',
      plan: 'free',
      is_admin: false
    });
  }

  // Run database migrations
  migratePollCountColumns();
  migrateReelTypesCaptionSettings();
  migrateMinMaxCaptionLength();
  migrateAllowCustomAudio();
  migrateReelTypeLabels();
  migrateAdminRole();
  
  // Run reel data migration (disabled - use /admin to manage data)
  // migrateInitialReelData();
  
  // Migrations have been applied, no need to run on each startup
  // migrateCaptionColumn();
  // migrateStatusConstraint();
};

// Initialize the database when this module is imported
initializeDemoData().catch(() => {
  // Initialization error handled silently
});

export default db;
