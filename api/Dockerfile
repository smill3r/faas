# Use an official Node.js runtime as the base image
FROM node:18-alpine AS build

# Install OpenSSL in the run image as well
RUN apk add --no-cache openssl

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies (including TypeScript)
RUN npm install

# Copy the rest of the application code
COPY . .

# Compile TypeScript code
RUN npx tsc

# Use a separate, smaller image for running the app
FROM node:18-alpine AS run

# Set the working directory inside the container
WORKDIR /app

# Copy compiled JavaScript code and node_modules from the build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

# Expose the desired port
EXPOSE 3000

# Set the command to run the application
CMD ["node", "dist/app.js"]