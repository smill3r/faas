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

# Install OpenSSL in the run image as well
RUN apk add --no-cache openssl

# Set the working directory inside the container
WORKDIR /app

# Copy the generated SSL certificate creation script
COPY generate-cert.sh . 

# Make the certificate creation script executable
RUN chmod +x generate-cert.sh

# Copy compiled JavaScript code and node_modules from the build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

# Create a script to run the certificate generation and start the app
RUN echo '#!/bin/sh' > start.sh && \
    echo './generate-cert.sh' >> start.sh && \
    echo 'node dist/app.js' >> start.sh && \
    chmod +x start.sh

# Expose the desired port
EXPOSE 3000

# Set the command to run the application
CMD ["./start.sh"]