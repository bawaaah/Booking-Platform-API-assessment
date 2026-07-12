# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Copy dependency files first (layer cache optimisation)
COPY package*.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci

# Copy source code
COPY . .

# Compile TypeScript
RUN npm run build

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:22-alpine

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy compiled output from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Expose API port
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/main"]
