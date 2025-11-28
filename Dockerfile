# syntax=docker/dockerfile:1

# Stage 1: Install dependencies
FROM node:18-bullseye-slim AS deps
WORKDIR /app

COPY package*.json ./
COPY project/package*.json project/

RUN npm ci

# Stage 2: Build frontend
FROM node:18-bullseye-slim AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/project/node_modules ./project/node_modules
COPY . .

RUN npm run build

# Stage 3: Production image
FROM node:18-bullseye-slim AS production
WORKDIR /app
ENV NODE_ENV=production
ENV npm_config_loglevel=error
ENV npm_config_fund=false
ENV npm_config_audit=false
ENV npm_config_ignore_scripts=true

# Install PostgreSQL client for database migrations
RUN apt-get update && \
    apt-get install -y postgresql-client && \
    rm -rf /var/lib/apt/lists/*

# Copy package files and install production dependencies
COPY package*.json ./
COPY project/package*.json project/
RUN npm ci --omit=dev
ENV npm_config_ignore_scripts=false

# Copy application code
COPY server.js worker.js start-production.js reportGeneratorServer.cjs ./
COPY scripts/ ./scripts/
COPY db/ ./db/
COPY prompts/ ./prompts/

# Copy project files (excluding node_modules and dist)
COPY project/src/ ./project/src/
COPY project/public/ ./project/public/
COPY project/index.html ./project/
COPY project/tsconfig*.json ./project/
COPY project/vite.config.ts ./project/
COPY project/eslint.config.js ./project/

# Copy built frontend from build stage
COPY --from=build /app/project/dist ./project/dist

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start the application
CMD ["node", "start-production.js"]
