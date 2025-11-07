# -------------------------------
# STAGE 1: BUILDER
# -------------------------------
FROM node:20 AS builder

# Zet werkdirectory
WORKDIR /app

# Kopieer package files eerst (zodat npm install gecached wordt)
COPY package*.json ./

# Installeer dependencies inclusief dev dependencies
RUN npm install --legacy-peer-deps

# Kopieer de rest van de broncode
COPY . .

# ✅ Genereer Prisma client
RUN npx prisma generate

# ✅ Build het NestJS project
RUN npm run build


# -------------------------------
# STAGE 2: RUNTIME (PRODUCTION)
# -------------------------------
FROM node:20-alpine AS runner

# Zet werkdirectory
WORKDIR /app

# Prisma heeft OpenSSL nodig voor connecties met PostgreSQL
RUN apk add --no-cache openssl

# Kopieer alleen wat nodig is voor productie
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Zet omgeving
ENV NODE_ENV=production
ENV PORT=3000

# Expose poort
EXPOSE 4000

# Start de applicatie
CMD ["node", "dist/main.js"]
