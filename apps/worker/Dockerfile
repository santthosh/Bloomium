FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/worker/package.json ./apps/worker/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/worker/node_modules ./apps/worker/node_modules
COPY . .
RUN pnpm --filter @bloomium/worker build

FROM base AS runner
WORKDIR /app/apps/worker
ENV NODE_ENV=production

COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/apps/worker/node_modules ./node_modules
COPY --from=builder /app/apps/worker/dist ./dist
COPY --from=builder /app/apps/worker/package.json ./package.json
COPY --from=builder /app/apps/worker/fixtures ./fixtures

ENTRYPOINT ["node", "dist/index.js"]

