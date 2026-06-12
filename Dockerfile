# ---------- Build Stage ----------
FROM node:20-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy dependency definitions first for better Docker caching
COPY package*.json ./

# Install all dependencies (including devDependencies for the build)
RUN npm ci

# Copy the entire project into the container
COPY . .

# Build the frontend (expects "dist" as output directory)
RUN npm run build


# ---------- Runtime Stage ----------
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy the built frontend from the builder stage
COPY --from=builder /app/dist ./dist

# Copy your Express server
COPY server ./server

# Copy package files (only production dependencies will be installed)
COPY package*.json ./

# Install only production dependencies (Express, etc.)
RUN npm ci --omit=dev

# Expose the port your server listens on
EXPOSE 3000

# Start the server
CMD ["node", "server/main.mjs"]
