# apps/backend/Dockerfile
FROM node:22-alpine

# 1) System deps (openssl for Prisma)
RUN apk add --no-cache openssl

# 2) App dir
WORKDIR /app

# 3) Install deps first (better cache)
COPY package*.json tsconfig.json ./
COPY prisma ./prisma
RUN npm ci

# 4) Copy source
COPY src ./src
COPY shared ./shared

# 5) Generate Prisma client
RUN npx prisma generate

# 6) Expose API port
EXPOSE 8080

# 7) Start in dev (tsx watch)
CMD ["npm", "run", "dev"]
