# Use multi-stage build
FROM node:18 AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install   # installs deps + devDeps
COPY . .
RUN npm run build

# production image
FROM node:18
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm install --only=production

CMD ["node", "dist/index.js"]
