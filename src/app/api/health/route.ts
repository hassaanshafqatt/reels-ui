import { NextResponse } from 'next/server';
import { getDatabaseHealth } from '@/lib/database-optimized';
import { logger } from '@/lib/logger';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Health check response interface
interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: ServiceHealth;
    filesystem: ServiceHealth;
    memory: ServiceHealth;
  };
  metrics?: {
    responseTime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: number;
  };
}

interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  message?: string;
  details?: Record<string, unknown> | { error: string };
}

/**
 * Comprehensive health check endpoint
 */
export async function GET() {
  const startTime = Date.now();

  try {
    const healthStatus = await performHealthCheck();
    const responseTime = Date.now() - startTime;

    // Add metrics to response
    healthStatus.metrics = {
      responseTime,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
    };

    const statusCode = healthStatus.status === 'healthy' ? 200 :
                      healthStatus.status === 'degraded' ? 200 : 503;

    logger.info('Health check completed', {
      status: healthStatus.status,
      responseTime: `${responseTime}ms`,
      databaseStatus: healthStatus.services.database.status,
      filesystemStatus: healthStatus.services.filesystem.status,
    });

    return NextResponse.json(healthStatus, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check': healthStatus.status,
        'X-Response-Time': `${responseTime}ms`,
      }
    });

  } catch {
    logger.error('Health check failed', {
      responseTime: `${Date.now() - startTime}ms`,
    });

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 503 }
    );
  }
}

/**
 * Perform comprehensive health checks
 */
async function performHealthCheck(): Promise<HealthStatus> {
  const services: HealthStatus['services'] = {
    database: { status: 'down' },
    filesystem: { status: 'down' },
    memory: { status: 'up' },
  };

  let overallStatus: HealthStatus['status'] = 'healthy';

  // Database health check
  try {
    const dbHealth = await getDatabaseHealth();
    // Normalize dbHealth.details into the typed shape
    let dbDetails: Record<string, unknown> | { error: string } | undefined;
    if (typeof dbHealth.details === 'string') {
      dbDetails = { error: dbHealth.details };
    } else if (dbHealth.details && typeof dbHealth.details === 'object') {
      dbDetails = dbHealth.details as Record<string, unknown>;
    } else {
      dbDetails = undefined;
    }

    services.database = {
      status: dbHealth.healthy ? 'up' : 'down',
      message: dbHealth.healthy ? 'Database is healthy' : 'Database is unhealthy',
      details: dbDetails,
    };

    if (!dbHealth.healthy) {
      overallStatus = 'unhealthy';
    }
  } catch {
    services.database = {
      status: 'down',
      message: `Database check failed`,
    };
    overallStatus = 'unhealthy';
  }

  // Filesystem health check
  try {
    const fsHealth = await checkFilesystemHealth();
    services.filesystem = fsHealth;

    if (fsHealth.status !== 'up') {
      overallStatus = overallStatus === 'unhealthy' ? 'unhealthy' : 'degraded';
    }
  } catch {
    services.filesystem = {
      status: 'down',
      message: `Filesystem check failed`,
    };
    overallStatus = 'unhealthy';
  }

  // Memory health check
  try {
    const memHealth = checkMemoryHealth();
    services.memory = memHealth;

    if (memHealth.status !== 'up') {
      overallStatus = overallStatus === 'unhealthy' ? 'unhealthy' : 'degraded';
    }
  } catch {
    services.memory = {
      status: 'down',
      message: `Memory check failed`,
    };
    overallStatus = 'unhealthy';
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    services,
  };
}

/**
 * Check filesystem health
 */
async function checkFilesystemHealth(): Promise<ServiceHealth> {
  try {
    // Check if data directory exists and is writable
    const dataDir = path.join(process.cwd(), 'data');
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

    // Check data directory
    if (!fs.existsSync(dataDir)) {
      return {
        status: 'down',
        message: 'Data directory does not exist',
      };
    }

    // Check if data directory is writable
    try {
      fs.accessSync(dataDir, fs.constants.W_OK);
    } catch {
      return {
        status: 'down',
        message: 'Data directory is not writable',
      };
    }

    // Check uploads directory
    if (!fs.existsSync(uploadsDir)) {
      return {
        status: 'down',
        message: 'Uploads directory does not exist',
      };
    }

  // Get disk usage information
  // stats are not currently used but kept for future diagnostics
  void fs.statSync(dataDir);
    const diskUsage = await getDiskUsage(dataDir);

    return {
      status: 'up',
      message: 'Filesystem is healthy',
      details: {
        dataDirExists: true,
        uploadsDirExists: true,
        dataDirWritable: true,
        diskUsage,
      },
    };
  } catch {
    return {
      status: 'down',
      message: `Filesystem check failed`,
    };
  }
}

/**
 * Check memory health
 */
function checkMemoryHealth(): ServiceHealth {
  try {
    const memUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();

    // Check if memory usage is too high (>90% of available memory)
    const memoryUsagePercent = (memUsage.heapUsed / totalMemory) * 100;

    if (memoryUsagePercent > 90) {
      return {
        status: 'degraded',
        message: `High memory usage: ${memoryUsagePercent.toFixed(1)}%`,
        details: {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          external: memUsage.external,
          totalMemory,
          freeMemory,
          usagePercent: memoryUsagePercent,
        },
      };
    }

    return {
      status: 'up',
      message: 'Memory usage is normal',
      details: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        totalMemory,
        freeMemory,
        usagePercent: memoryUsagePercent,
      },
    };
  } catch (err) {
    return {
      status: 'down',
      message: `Memory check failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get disk usage information
 */
async function getDiskUsage(dirPath: string): Promise<Record<string, string | number> | { error: string }> {
  try {
    // Get directory size (simplified)
    const getDirSize = (dirPath: string): number => {
      let totalSize = 0;

      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          totalSize += getDirSize(filePath);
        } else {
          totalSize += stat.size;
        }
      }

      return totalSize;
    };

    const size = getDirSize(dirPath);

    return {
      size,
      sizeMB: Number((size / (1024 * 1024)).toFixed(2)),
      sizeGB: Number((size / (1024 * 1024 * 1024)).toFixed(2)),
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Metrics endpoint for detailed monitoring
 */
export async function METRICS() {
  try {
    const metrics = await collectMetrics();

    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err) {
    logger.error('Metrics collection failed', {
      error: err instanceof Error ? err.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to collect metrics' },
      { status: 500 }
    );
  }
}

/**
 * Collect detailed metrics in Prometheus format
 */
async function collectMetrics(): Promise<string> {
  const timestamp = Date.now();

  let metrics = `# HELP node_uptime_seconds Time the Node.js process has been running
# TYPE node_uptime_seconds gauge
node_uptime_seconds ${process.uptime()}

# HELP node_memory_heap_used_bytes Memory heap used by Node.js
# TYPE node_memory_heap_used_bytes gauge
node_memory_heap_used_bytes ${process.memoryUsage().heapUsed}

# HELP node_memory_heap_total_bytes Memory heap total for Node.js
# TYPE node_memory_heap_total_bytes gauge
node_memory_heap_total_bytes ${process.memoryUsage().heapTotal}

# HELP process_start_time_seconds Start time of the process
# TYPE process_start_time_seconds gauge
process_start_time_seconds ${(timestamp - (process.uptime() * 1000)) / 1000}

`;

  // Database metrics
  try {
    const dbHealth = await getDatabaseHealth();
    if (dbHealth.healthy && dbHealth.details && typeof dbHealth.details === 'object') {
      const details = dbHealth.details as Record<string, unknown>;
      const size = typeof details.size === 'number' ? details.size : undefined;
      const pages = typeof details.pages === 'number' ? details.pages : undefined;

      if (typeof size === 'number') {
        metrics += `# HELP database_size_bytes Size of the database file
# TYPE database_size_bytes gauge
database_size_bytes ${size}

`;
      }

      if (typeof pages === 'number') {
        metrics += `# HELP database_pages Number of pages in the database
# TYPE database_pages gauge
database_pages ${pages}
`;
      }
    }
  } catch {
    logger.warn('Failed to collect database metrics');
  }

  return metrics;
}