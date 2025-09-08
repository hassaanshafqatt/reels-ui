import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

// Initialize database
const dbPath = path.join(process.cwd(), 'data', 'reelcraft.db');
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
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result_url?: string;
  error_message?: string;
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
  external_url?: string;
  status_url?: string;
  posting_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
      result_url TEXT,
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
      external_url TEXT,
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

// Initialize tables
createUsersTable();
createSessionsTable();
createJobsTable();
createReelCategoriesTable();
createReelTypesTable();

// User operations
export const userOperations = {
  // Create a new user
  create: (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) => {
    const id = crypto.randomUUID();
    const stmt = db.prepare(`
      INSERT INTO users (id, email, password_hash, name, plan, avatar)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    try {
      stmt.run(id, userData.email, userData.password_hash, userData.name, userData.plan, userData.avatar);
      return { success: true, userId: id };
    } catch (error: unknown) {
      const dbError = error as { code?: string };
      if (dbError.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return { success: false, error: 'Email already exists' };
      }
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
    } catch (error) {
      return { success: false, error: 'Failed to update user' };
    }
  },

  // Delete user
  delete: (id: string) => {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    try {
      stmt.run(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to delete user' };
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
      stmt.run(id, userId, token, expiresAt.toISOString());
      return { success: true, sessionId: id };
    } catch (error) {
      return { success: false, error: 'Failed to create session' };
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
      INSERT INTO jobs (id, user_id, job_id, category, type)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, userId, jobData.jobId, jobData.category, jobData.type);
    return id;
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
  updateStatus: (jobId: string, status: string, resultUrl?: string, errorMessage?: string) => {
    const stmt = db.prepare(`
      UPDATE jobs 
      SET status = ?, result_url = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
      WHERE job_id = ?
    `);
    stmt.run(status, resultUrl || null, errorMessage || null, jobId);
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

// Reel type operations
export const reelTypeOperations = {
  // Create a new reel type
  create: (typeData: Omit<ReelType, 'id' | 'created_at' | 'updated_at'>) => {
    const id = crypto.randomUUID();
    const stmt = db.prepare(`
      INSERT INTO reel_types (id, category_id, name, title, description, icon, message, caption, external_url, status_url, posting_url, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      typeData.external_url,
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
    return stmt.all() as ReelType[];
  },

  // Get reel types by category
  getByCategory: (categoryId: string, activeOnly = false): ReelType[] => {
    const whereClause = activeOnly ? 'AND is_active = 1' : '';
    const stmt = db.prepare(`
      SELECT * FROM reel_types 
      WHERE category_id = ? ${whereClause}
      ORDER BY title
    `);
    return stmt.all(categoryId) as ReelType[];
  },

  // Get reel type by id
  getById: (id: string): ReelType | null => {
    const stmt = db.prepare('SELECT * FROM reel_types WHERE id = ?');
    return stmt.get(id) as ReelType | null;
  },

  // Get reel type by name and category
  getByName: (name: string, categoryId: string): ReelType | null => {
    const stmt = db.prepare('SELECT * FROM reel_types WHERE name = ? AND category_id = ?');
    return stmt.get(name, categoryId) as ReelType | null;
  },

  // Get reel type by name only (across all categories)
  getByNameOnly: (name: string): ReelType | null => {
    const stmt = db.prepare('SELECT * FROM reel_types WHERE name = ? LIMIT 1');
    return stmt.get(name) as ReelType | null;
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
      console.log(`Created category: ${category.title}`);
    } else {
      categoryMap[category.name] = existingCategory.id;
    }
  }

  // Insert types
  for (const type of types) {
    const categoryId = categoryMap[type.category_name];
    if (!categoryId) {
      console.error(`Category not found: ${type.category_name}`);
      continue;
    }

    const existingType = reelTypeOperations.getByName(type.name, categoryId);
    if (!existingType) {
      const { category_name, ...typeData } = type;
      reelTypeOperations.create({
        ...typeData,
        category_id: categoryId
      });
      console.log(`Created type: ${type.title}`);
    }
  }

  console.log('Initial reel data migration completed');
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
      plan: 'pro'
    });

    const hashedPassword2 = await passwordUtils.hash('test123');
    userOperations.create({
      email: 'test@example.com',
      password_hash: hashedPassword2,
      name: 'Test User',
      plan: 'free'
    });
  }

  // Run reel data migration (disabled - use /admin to manage data)
  // migrateInitialReelData();
};

// Initialize demo data
initializeDemoData().catch(console.error);

export default db;
