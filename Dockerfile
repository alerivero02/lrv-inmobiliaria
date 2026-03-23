# Build frontend + servir API + estáticos (un solo servicio en Railway)
FROM node:22-bookworm-slim AS frontend
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM node:22-bookworm-slim AS backend
WORKDIR /app/backend-node
COPY backend-node/package.json backend-node/package-lock.json* ./
RUN npm ci --omit=dev
COPY backend-node/ ./

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV SERVE_STATIC=1
ENV FRONTEND_DIST=/app/dist
COPY --from=frontend /app/dist ./dist
COPY --from=backend /app/backend-node ./backend-node
WORKDIR /app/backend-node
EXPOSE 4000
CMD ["node", "server.js"]
