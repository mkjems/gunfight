FROM node:22-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /app/gameserver

COPY gameserver/package*.json ./
RUN npm ci --omit=dev

COPY gameserver ./
COPY www /app/www

USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api" || exit 1

CMD ["npm", "start"]
