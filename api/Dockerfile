# Use an official Node.js runtime as the base image
FROM node:18-alpine AS build

# OpenSSL for TLS; python3/make/g++ to compile isolated-vm native addon
RUN apk add --no-cache openssl python3 make g++

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./tsconfig.json

# Install dependencies (including TypeScript)
RUN npm install

COPY . .
RUN npx tsc

FROM node:18-alpine AS run

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/tsconfig.json ./tsconfig.json

EXPOSE 3000

# Set the command to run the application
CMD ["npm", "start"]
