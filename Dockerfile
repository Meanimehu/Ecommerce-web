# One file for every way the frontend runs in Docker. Development: docker compose up (README). Nothing else is needed
# on your machine: no Node.js, no PostgreSQL, no mkcert. The same pattern as the backend's Dockerfile.

# ---- dependencies (all, including development tools) ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci

# ---- development: your folder is mounted into the container; changes reload at once ----
FROM deps AS dev
# openssl makes the local HTTPS certificate on first start (Document 7, section 17.1).
RUN apk add --no-cache openssl
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3001
CMD ["sh", "scripts/docker-dev.sh"]

# ---- tools: store migrations, checks and tests (has development dependencies) ----
FROM deps AS tools
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1

# ---- build: the production build ----
FROM tools AS build
RUN npm run build

# ---- runtime: small image, plain Node.js server (D4-03), runs as the unprivileged "node" user ----
FROM node:22-alpine AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3001 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /app/.next/standalone ./
USER node
EXPOSE 3001
HEALTHCHECK --interval=10s --timeout=5s --retries=5 CMD node -e "fetch('http://127.0.0.1:3001/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
