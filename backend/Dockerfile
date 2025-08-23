# Use multi-stage build for optimal production image
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json  ./


# Install pnpm globally
RUN npm install

# Copy source code
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose the port
EXPOSE 5000

# Start the application
CMD ["node", "dist/main.js"]
