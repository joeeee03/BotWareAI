# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install all dependencies (including devDependencies for build)
RUN npm ci
RUN npm --prefix backend ci

# Copy all frontend source files
COPY app/ ./app/
COPY components/ ./components/
COPY contexts/ ./contexts/
COPY hooks/ ./hooks/
COPY lib/ ./lib/
COPY public/ ./public/
COPY styles/ ./styles/
COPY types/ ./types/

# Copy config files
COPY next.config.mjs ./
COPY tsconfig.json ./
COPY postcss.config.mjs ./
COPY tailwind.config.ts ./

# Build frontend with Webpack (not Turbopack)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PRIVATE_DEBUG_CACHE=false
RUN npx next build --webpack 2>/dev/null || npx next build

# Copy backend source
COPY backend/ ./backend/

# Build backend TypeScript to JavaScript
RUN cd backend && npx tsc --skipLibCheck 2>/dev/null || true

# Production stage
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy built frontend from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/postcss.config.mjs ./

# Copy compiled backend JavaScript from builder
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package.json ./backend/package.json

# Copy root package files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --only=production
RUN npm --prefix backend ci --only=production

# Set port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3001/health || exit 1

# Start backend with Node directly (no tsx needed)
CMD ["node", "backend/dist/server.js"]
