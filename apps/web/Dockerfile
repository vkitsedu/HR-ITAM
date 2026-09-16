# Multi-Stage Production Dockerfile for EmpOps Web SPA
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/web/package*.json ./apps/web/

# Install dependencies
RUN npm install

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY apps/web/ ./apps/web/

# Build shared types and web bundle
RUN npm run build --workspace=@empops/shared
RUN npm run build --workspace=@empops/web

# Nginx Production Server
FROM nginx:alpine AS runner

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
