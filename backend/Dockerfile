# Use multi-stage build for optimal production image
FROM node:18-alpine AS builder

# Install pnpm globally
RUN npm install -g pnpm typescript

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy source code
COPY . .

# Build the TypeScript code
RUN pnpm run build

# Production stage
FROM node:18-alpine AS production

# Install pnpm globally
RUN npm install -g pnpm typescript

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Expose the port
EXPOSE 5000

# Start the application
CMD ["node", "dist/main.js"]
