# Use Node.js 20 slim (Debian) as base image — Debian has better support for building native modules
FROM node:20-slim AS base

# Install dependencies only when needed
FROM base AS deps
# Install build dependencies required by native modules (better-sqlite3) and sqlite headers
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      python3 \
      python3-dev \
      build-essential \
      pkg-config \
      libsqlite3-dev \
      sqlite3 \
      ca-certificates && \
    rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci && npm rebuild --build-from-source better-sqlite3; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found. Please commit package-lock.json/yarn.lock/pnpm-lock.yaml for reproducible builds." && exit 1; \
  fi


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found. Please commit package-lock.json/yarn.lock/pnpm-lock.yaml for reproducible builds." && exit 1; \
  fi

# Production image, copy all the files and run next
# Production runner image based on Debian slim
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

# Add non-sensitive default environment variables. Sensitive values (API keys, secrets)
# should NOT be baked into the image. Provide them at runtime using --env-file or
# your container orchestration secrets mechanism. See README or the comment at the
# end of this file for example usage.
ENV DATABASE_URL=/app/data/reelcraft.db
ENV PORT=4761
ENV HOSTNAME="0.0.0.0"

# Install sqlite3 runtime for production
RUN apt-get update && \
  apt-get install -y --no-install-recommends sqlite3 libsqlite3-0 && \
  rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create data directory for SQLite database with proper permissions
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data && chmod -R 755 /app/data

# Create uploads directory with proper permissions
RUN mkdir -p /app/public/uploads/audio && chown -R nextjs:nodejs /app/public/uploads && chmod -R 755 /app/public/uploads

# Copy and setup init script
COPY --chown=nextjs:nodejs docker-init.sh /usr/local/bin/docker-init.sh
RUN chmod +x /usr/local/bin/docker-init.sh && \
    # Convert Windows line endings to Unix line endings
    sed -i 's/\r$//' /usr/local/bin/docker-init.sh

# Copy a non-sensitive example env file into the image so users know the variable names.
# Do NOT include any real secrets in `.env.example`. Operators should mount or pass
# a real `.env` at runtime (e.g. docker run --env-file ./prod.env ...).
COPY .env.example /app/.env.example

# Ensure the nextjs user owns the entire app directory
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 4761

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
ENTRYPOINT ["/usr/local/bin/docker-init.sh"]
CMD ["node", "server.js"]

# Lightweight healthcheck to ensure the server process responds on the expected port.
# This keeps the container status visible to orchestrators and auto-restarts unhealthy containers.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --spider --quiet http://localhost:4761/api/health || exit 1

# Usage note:
# Do NOT bake secrets into the image. Supply runtime secrets with Docker's
# --env-file option or your orchestration system's secret management.
# Example (local):
#   docker run --rm -p 4761:4761 --env-file ./prod.env my-reelcraft-image
# Or with individual env vars:
#   docker run -e API_KEY=... -e JWT_SECRET=... -p 4761:4761 my-reelcraft-image
