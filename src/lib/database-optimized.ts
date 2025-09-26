import Database, { Options } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { logger, handleDatabaseError } from './logger';

// Database configuration
interface DatabaseConfig {
  path: string;
  options: Options;
  pragmas: Record<string, string | number>;
}

// Production database configuration
const getDatabaseConfig = (): DatabaseConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  const dbPath =
    process.env.DATABASE_URL ||
    path.join(process.cwd(), 'data', 'reelcraft.db');

  return {
    path: dbPath,
    options: {
      readonly: false,
      fileMustExist: false,
      timeout: 5000, // 5 second timeout
      // verbose in better-sqlite3 accepts arbitrary args; normalize to unknown[]
      verbose: isProduction
        ? undefined
        : (...args: unknown[]) => {
            // Log the first arg if present; stringify safely
            const first = args && args.length > 0 ? String(args[0]) : undefined;
            logger.debug('SQLite:', { message: first });
          },
    } as Options,
    pragmas: {
      // Performance optimizations
      journal_mode: 'WAL', // Write-Ahead Logging for better concurrency
      synchronous: 'NORMAL', // Balance between performance and safety
      cache_size: -64000, // 64MB cache (negative for KB)
      temp_store: 'MEMORY', // Store temp tables in memory
      mmap_size: 268435456, // 256MB memory-mapped I/O
      foreign_keys: 'ON', // Enable foreign key constraints
      busy_timeout: 30000, // 30 second busy timeout
      wal_autocheckpoint: 1000, // Checkpoint WAL every 1000 pages
      optimize: '0x10002', // Optimize database on open
    },
  };
};

// Database connection pool (singleton pattern for SQLite)
class DatabaseConnection {
  private static instance: DatabaseConnection;
  private db: Database.Database | null = null;
  private config: DatabaseConfig;

  private constructor() {
    this.config = getDatabaseConfig();
  }

  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  getConnection(): Database.Database {
    if (!this.db) {
      this.initializeConnection();
    }
    return this.db!;
  }

  private initializeConnection() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.config.path);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true, mode: 0o755 });
        logger.info('Created database directory', { path: dataDir });
      }

      // Initialize database connection
      this.db = new Database(this.config.path, this.config.options);
      logger.info('Database connection established', {
        path: this.config.path,
      });

      // Apply pragmas for optimization
      this.applyPragmas();

      // Set up connection monitoring
      this.setupConnectionMonitoring();
    } catch (err: unknown) {
      logger.error('Failed to initialize database connection', {
        error: err instanceof Error ? err.message : 'Unknown error',
        path: this.config.path,
      });
      throw err;
    }
  }

  private applyPragmas() {
    if (!this.db) return;

    try {
      for (const [pragma, value] of Object.entries(this.config.pragmas)) {
        // Construct a safe SQL value for the pragma. Numbers are left as-is, strings are quoted.
        let sqlValue: string | number = value as string | number;
        if (typeof value === 'string') {
          // If the string looks like a hex or numeric literal, leave as-is; otherwise quote safely
          if (/^\d+$/.test(value) || /^0x[0-9a-fA-F]+$/.test(value)) {
            sqlValue = value;
          } else {
            // Escape single quotes
            const escaped = value.replace(/'/g, "''");
            sqlValue = `'${escaped}'`;
          }
        }

        // Use better-sqlite3's pragma method to set pragmas safely
        try {
          // db.pragma accepts a SQL string like "journal_mode = WAL" and returns the value
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - better-sqlite3 types for pragma may vary, but this usage is supported at runtime
          this.db.pragma(`${pragma} = ${sqlValue}`);
          logger.debug(`Applied pragma: ${pragma} = ${sqlValue}`);
        } catch (innerErr) {
          logger.warn(`Could not apply pragma ${pragma}`, {
            error:
              innerErr instanceof Error ? innerErr.message : String(innerErr),
          });
        }
      }
      logger.info('Database pragmas applied successfully');
    } catch (err: unknown) {
      logger.error('Failed to apply database pragmas', {
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  private setupConnectionMonitoring() {
    if (!this.db) return;

    // Monitor database statistics
    const stats = this.db.prepare('PRAGMA database_list').all();
    logger.info('Database connection monitoring enabled', {
      databases: stats.length,
      pragmas: this.config.pragmas,
    });
  }

  // Health check method
  async healthCheck(): Promise<{
    healthy: boolean;
    details?: Record<string, unknown> | string;
  }> {
    try {
      if (!this.db) {
        return { healthy: false, details: 'No database connection' };
      }

      // Test basic query
      const result = this.db.prepare('SELECT 1 as test').get() as {
        test: number;
      };

      if (result.test !== 1) {
        return { healthy: false, details: 'Health check query failed' };
      }

      // Get database statistics
      const pageCount = this.db.prepare('PRAGMA page_count').get() as {
        page_count: number;
      };
      const pageSize = this.db.prepare('PRAGMA page_size').get() as {
        page_size: number;
      };
      const dbSize = pageCount.page_count * pageSize.page_size;

      return {
        healthy: true,
        details: {
          size: dbSize,
          pages: pageCount.page_count,
          pageSize: pageSize.page_size,
          path: this.config.path,
        },
      };
    } catch (err: unknown) {
      return {
        healthy: false,
        details: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // Backup method for production
  async createBackup(backupPath?: string): Promise<string> {
    if (!this.db) {
      throw new Error('No database connection available');
    }

    const backupFile = backupPath || `${this.config.path}.backup.${Date.now()}`;

    try {
      // SQLite backup using SQL
      this.db.backup(backupFile);
      logger.info('Database backup created', { backupPath: backupFile });

      return backupFile;
    } catch (err: unknown) {
      logger.error('Failed to create database backup', {
        error: err instanceof Error ? err.message : 'Unknown error',
        backupPath: backupFile,
      });
      throw err;
    }
  }

  // Cleanup method
  close() {
    if (this.db) {
      try {
        this.db.close();
        logger.info('Database connection closed');
      } catch (err: unknown) {
        logger.error('Error closing database connection', {
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      } finally {
        this.db = null;
      }
    }
  }
}

// Export singleton instance
export const dbConnection = DatabaseConnection.getInstance();

// Export database instance for backward compatibility
export const db = dbConnection.getConnection();

// Optimized prepared statements cache
const statementCache = new Map<string, Database.Statement>();

export function getCachedStatement(sql: string): Database.Statement {
  if (!statementCache.has(sql)) {
    try {
      const stmt = db.prepare(sql);
      statementCache.set(sql, stmt);
    } catch (err) {
      handleDatabaseError(err, 'prepare statement');
    }
  }
  return statementCache.get(sql)!;
}

// Transaction wrapper with error handling
export function withTransaction<T>(callback: () => T): T {
  const transaction = db.transaction(callback);

  try {
    return transaction();
  } catch (err) {
    handleDatabaseError(err, 'transaction');
  }
}

// Connection health monitoring
export async function getDatabaseHealth(): Promise<{
  healthy: boolean;
  details?: Record<string, unknown> | string;
}> {
  return await dbConnection.healthCheck();
}

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, closing database connection...');
  dbConnection.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, closing database connection...');
  dbConnection.close();
  process.exit(0);
});
