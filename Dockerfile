# ============================
# 1️⃣ Dependencies Stage
# ============================
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (needed for build)
RUN npm install

# ============================
# 2️⃣ Build Stage
# ============================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma Client
RUN npx prisma generate

# Build NestJS application
RUN npm run build

# Remove devDependencies and keep only production dependencies
RUN npm prune --production

# Generate Prisma Client again for production node_modules
RUN npx prisma generate

# ============================
# 3️⃣ Production Stage
# ============================
FROM node:20-alpine AS production

# Set NODE_ENV
#ENV NODE_ENV=production

WORKDIR /app

# Install Doppler CLI (for secure runtime secrets)
RUN apk add --no-cache wget ca-certificates && \
    wget -q -t3 'https://packages.doppler.com/public/cli/rsa.8004D9FF50437357.key' -O /etc/apk/keys/cli@doppler-8004D9FF50437357.rsa.pub && \
    echo 'https://packages.doppler.com/public/cli/alpine/any-version/main' | tee -a /etc/apk/repositories && \
    apk add doppler && \
    rm -rf /var/cache/apk/*

# Copy production node_modules from builder (already pruned)
COPY --from=builder /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy package.json (needed for app metadata)
COPY --from=builder /app/package.json ./package.json

# Copy Prisma schema and migrations
COPY --from=builder /app/prisma ./prisma

# Copy startup script
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

# Copy migrate script
COPY migrate.sh ./migrate.sh
RUN chmod +x ./migrate.sh

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose application port
EXPOSE 8080

# Use startup script
ENTRYPOINT ["./start.sh"]