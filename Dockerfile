# Base Image
FROM node:18-alpine

# Working Directory
WORKDIR /app

# Copy package files from server directory
COPY server/package*.json ./

# Install Dependencies
RUN npm install

# Copy server source code
COPY server/ .

# Expose Port
EXPOSE 5000

# Start Command
CMD ["npm", "start"]
