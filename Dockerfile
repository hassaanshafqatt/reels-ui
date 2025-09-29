# ---------- Base image ----------
FROM node:20-slim AS base

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Set working directory
WORKDIR /app


# ---------- Dependencies stage ----------
FROM base AS deps

# Install system deps for building native modules (e.g. better-sqlite3)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    build-essential \
    pkg-config \
    libsqlite3-dev \
    sqlite3 \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy lockfiles & install
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci && npm rebuild --build-from-source better-sqlite3; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "❌ Lockfile missing. Please commit lockfile for reproducible builds." && exit 1; \
  fi


# ---------- Build stage ----------
FROM base AS builder

# Copy node_modules from deps
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js app
RUN \
  if [ -f yarn.lock ]; then yarn build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "❌ Lockfile missing. Please commit lockfile for reproducible builds." && exit 1; \
  fi


# ---------- Runner stage ----------
FROM base AS runner

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Working dir
WORKDIR /app

# Runtime environment
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=4761

# Install only runtime sqlite (lighter than build deps)
RUN apt-get update && apt-get install -y --no-install-recommends \
    sqlite3 libsqlite3-0 wget \
  && rm -rf /var/lib/apt/lists/*

# Copy required build output
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Data & uploads dirs with proper permissions
RUN mkdir -p /app/data /app/public/uploads/audio \
 && chown -R nextjs:nodejs /app/data /app/public/uploads \
 && chmod -R 755 /app/data /app/public/uploads

# Copy init script
COPY --chown=nextjs:nodejs docker-init.sh /usr/local/bin/docker-init.sh
RUN chmod +x /usr/local/bin/docker-init.sh \
 && sed -i 's/\r$//' /usr/local/bin/docker-init.sh

# Switch to non-root user **after all installs/config**
USER nextjs

# Expose app port
EXPOSE 4761

# Healthcheck (lightweight)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --spider --quiet http://localhost:4761/api/health || exit 1

# Entrypoint
ENTRYPOINT ["/usr/local/bin/docker-init.sh"]
CMD ["node", "server.js"]