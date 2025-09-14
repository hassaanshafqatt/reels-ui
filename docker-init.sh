#!/bin/sh

# Database and application initialization script for Docker container

echo "========================================="
echo "Initializing ReelCraft Application..."
echo "========================================="

# Function to log with timestamp
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log "Starting initialization process..."

# Ensure required directories exist with correct permissions
log "Creating required directories..."
mkdir -p /app/data
mkdir -p /app/public/uploads/audio
mkdir -p /app/logs

log "Setting directory permissions..."
chown -R nextjs:nodejs /app/data
chown -R nextjs:nodejs /app/public/uploads
chown -R nextjs:nodejs /app/logs
chmod -R 755 /app/data
chmod -R 755 /app/public/uploads
chmod -R 755 /app/logs

# Check if database file exists, if not, create it with proper permissions
if [ ! -f /app/data/reelcraft.db ]; then
    log "Creating database file..."
    touch /app/data/reelcraft.db
    chown nextjs:nodejs /app/data/reelcraft.db
    chmod 664 /app/data/reelcraft.db
else
    log "Database file already exists"
fi

# Check database integrity
log "Checking database integrity..."
if sqlite3 /app/data/reelcraft.db "PRAGMA integrity_check;" > /dev/null 2>&1; then
    log "Database integrity check passed"
else
    log "Database integrity check failed - recreating database"
    rm -f /app/data/reelcraft.db
    touch /app/data/reelcraft.db
    chown nextjs:nodejs /app/data/reelcraft.db
    chmod 664 /app/data/reelcraft.db
fi

# Validate environment variables
log "Validating environment variables..."
if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your-default-secret-key-change-this-in-production" ]; then
    log "WARNING: JWT_SECRET is not set or using default value. Please set a secure JWT_SECRET in production!"
fi

if [ -z "$API_KEY" ] || [ "$API_KEY" = "your-default-api-key-change-this-in-production" ]; then
    log "WARNING: API_KEY is not set or using default value. Please set a secure API_KEY in production!"
fi

# Log environment info
log "Environment: $NODE_ENV"
log "Port: $PORT"
log "Database: $DATABASE_URL"

log "Initialization complete!"
echo "========================================="

# Start the application
log "Starting application..."
exec "$@"
