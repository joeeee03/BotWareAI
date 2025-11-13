# Build and production stage
FROM node:20-alpine

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm ci --only=production
RUN npm --prefix backend ci --only=production

# Copy backend source code
COPY backend/ ./backend/

# Copy scripts
COPY scripts/ ./scripts/

# Install dependencies for build
RUN npm ci

# Build TypeScript backend
RUN npm --prefix backend run build

# Install tsx for runtime
RUN npm install -g tsx

# Set port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Start the server
CMD ["npm", "start"]
