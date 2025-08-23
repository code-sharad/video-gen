
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --production
RUN npm run build

# Copy the rest of the application code
COPY dist ./dist/

# Expose the port the app runs on
EXPOSE 5000

# Start the server
CMD ["node", "dist/main.js"]