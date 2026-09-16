# Multi-Stage Production Dockerfile for EmpOps API
FROM node:20-alpine AS builder

WORKDIR /app
RUN apk add --no-cache openssl python3 make g++

# Copy package manifests
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/database/package*.json ./packages/database/
COPY apps/api/package*.json ./apps/api/

# Install dependencies
RUN npm install

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY packages/database/ ./packages/database/
COPY apps/api/ ./apps/api/

# Build packages and application
RUN npm run build --workspace=@empops/shared
RUN npm run build --workspace=@empops/database
RUN npm run build --workspace=@empops/api

# Production Runner
FROM node:20-alpine AS runner

WORKDIR /app
RUN apk add --no-cache openssl curl

ENV NODE_ENV=production
ENV PORT=4005

# Copy build artifacts and dependencies from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/apps/api ./apps/api

EXPOSE 4005

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4005/api/health || exit 1

CMD ["node", "apps/api/dist/main.js"]
