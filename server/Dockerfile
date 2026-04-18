FROM node:20-alpine

# Install postgresql-client for pg_isready (optional but helpful for health checks)
RUN apk add --no-cache postgresql-client

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the TypeScript project
RUN npm run build

# Expose the API port
EXPOSE 5000

# Start command: run migrations and seed then start the server
CMD npm run db:migrate && npm run db:seed && npm run start
