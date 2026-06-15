FROM node:18-alpine AS build

# python3/make/g++ to compile isolated-vm native addon
RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx tsc

FROM node:18-alpine AS run

WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

CMD ["node", "dist/index.js"]
