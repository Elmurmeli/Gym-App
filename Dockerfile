# 1. Build stage
FROM node:18 AS builder
    # Set working directory
WORKDIR /app
    # Install dependencies and build the app
COPY package*.json ./
RUN npm install
COPY . .
    #  Build the application
RUN npm run build

# 2. Serve with a lightweight static server
FROM node:18-alpine AS runner
    # Set working directory
WORKDIR /app
RUN npm install -g serve
    # Copy built assets from the build stage
COPY --from=builder /app/dist ./dist
    # Expose port and start the server
EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]