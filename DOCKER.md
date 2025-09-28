# Docker Deployment Guide

This project includes Docker support for easy deployment and development.

## Quick Start

### Using Docker

```bash
# Build the image
docker build -t reels-ui .

# Run the container
docker run -p 4761:4761 -v $(pwd)/data:/app/data reels-ui
```

### Using Docker Compose (Recommended)

```bash
# Start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

## Configuration

### Environment Variables

- `NODE_ENV`: Set to `production` for production builds
- `NEXT_TELEMETRY_DISABLED`: Set to `1` to disable Next.js telemetry
- `PORT`: Application port (default: 4761)
- `HOSTNAME`: Bind hostname (default: 0.0.0.0)

### Data Persistence

The SQLite database is stored in `/app/data` inside the container. Mount a volume to persist data:

```bash
docker run -p 4761:4761 -v ./data:/app/data reels-ui
```

## Development

### Local Development with Docker

```bash
# Build development image
docker build -t reels-ui:dev .

# Run with volume mounts for development
docker run -p 4761:4761 -v $(pwd):/app -v /app/node_modules reels-ui:dev
```

## Health Checks

The Docker Compose configuration includes health checks that verify the application is responding correctly.

## Troubleshooting

### Build Issues

If you encounter build issues with `better-sqlite3`:

1. Ensure you're using Node.js 20+
2. The Dockerfile includes Python and build tools
3. Clear Docker cache: `docker system prune -a`

#### Reproducible installs

- This project uses npm with a committed `package-lock.json` for reproducible installs. The Dockerfile runs `npm ci` in the build stage. If you see "Lockfile not found" errors, ensure `package-lock.json` is committed.

#### Native addons and host mismatch

- Native addon mismatch (invalid ELF header) happens when `node_modules` from your host are copied into the image. Make sure `.dockerignore` excludes `node_modules` and `.next` so the image contains binaries built for the correct target.

### Container Not Starting

Check the logs:

```bash
docker logs reels-ui-container
```

Common issues:

- Port 4761 already in use
- Insufficient permissions for data directory
- Missing environment variables

## Production Deployment

For production deployment:

1. Build the image: `docker build -t reels-ui:latest .`
2. Use docker-compose.yml with proper volumes
3. Configure reverse proxy (nginx/traefik) if needed
4. Set up monitoring and logging
5. Backup the data directory regularly
