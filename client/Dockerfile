FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose the Vite port
EXPOSE 5173

# Start Vite with --host to allow external connections
CMD ["npm", "run", "dev", "--", "--host"]
