# ===================================
# Build Stage - Compilar Backend y Frontend
# ===================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# ===== BACKEND BUILD =====
# Copy backend package files
COPY backend/package*.json ./backend/

# Install backend dependencies
RUN cd backend && npm ci

# Copy backend source
COPY backend/ ./backend/

# Build backend TypeScript to JavaScript
RUN cd backend && npm run build

# ===== FRONTEND BUILD =====
# Copy frontend package files
COPY package*.json ./

# Install frontend dependencies
RUN npm ci

# Copy all frontend source files
COPY app/ ./app/
COPY components/ ./components/
COPY contexts/ ./contexts/
COPY hooks/ ./hooks/
COPY lib/ ./lib/
COPY public/ ./public/
COPY styles/ ./styles/
COPY types/ ./types/
COPY components.json ./components.json

# Copy config files
COPY next.config.mjs ./
COPY tsconfig.json ./
COPY postcss.config.mjs ./
COPY tailwind.config.ts ./

# Build frontend with standalone output
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PRIVATE_DEBUG_CACHE=false
RUN npm run build

# ===================================
# Production Stage - Servidor Combinado
# ===================================
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Install PM2 for process management
RUN npm install -g pm2

# ===== COPY BACKEND =====
# Copy compiled backend from builder
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package*.json ./backend/

# Install backend production dependencies
RUN cd backend && npm ci --only=production

# ===== COPY FRONTEND =====
# Copy standalone Next.js build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy server-combined.js
COPY server-combined.js ./

# Expose ports (Railway will use PORT env variable)
EXPOSE 3000 3001

# Health check on frontend port
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:${PORT:-3000}/ || exit 1

# Start both services with PM2
CMD ["node", "server-combined.js"]
