# syntax=docker/dockerfile:1

# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---- Dependencies ----
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
# Force install all dependencies (including dev) by ensuring NODE_ENV is development
# Coolify injects NODE_ENV=production by default which skips devDeps
ENV NODE_ENV=development
RUN npm ci

# ---- Build ----
FROM base AS builder
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# ---- Production ----
FROM base AS runner
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma files for runtime
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Ensure prisma directory is writable by nextjs user
RUN chown -R nextjs:nodejs ./prisma

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Install Prisma CLI globally to avoid npx downloading latest version
# Must be done before switching to non-root user
RUN npm install -g prisma@5.22.0

USER nextjs

# Set default DATABASE_URL to writable location (can be overridden by Coolify)
ENV DATABASE_URL="file:/app/data/tripledger.db"

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Initialize DB and start
CMD ["sh", "-c", "prisma db push --skip-generate && node server.js"]
