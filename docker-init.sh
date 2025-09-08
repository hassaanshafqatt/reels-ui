#!/bin/sh

# Database initialization script for Docker container

echo "Initializing database permissions..."

# Ensure data directory exists and has correct permissions
mkdir -p /app/data
chown -R nextjs:nodejs /app/data
chmod -R 755 /app/data

# Check if database file exists, if not, create it with proper permissions
if [ ! -f /app/data/reelcraft.db ]; then
    echo "Creating database file..."
    touch /app/data/reelcraft.db
    chown nextjs:nodejs /app/data/reelcraft.db
    chmod 664 /app/data/reelcraft.db
fi

echo "Database initialization complete"

# Start the application
exec "$@"
