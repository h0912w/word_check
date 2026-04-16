# Dockerfile for Railway deployment
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci --only=production

# Copy server source
COPY server/ ./server/
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build:server

# Expose port
EXPOSE 3001

# Set environment defaults
ENV PORT=3001
ENV NODE_ENV=production

# Start server
CMD ["node", "server/dist/google-ads-server.js"]
