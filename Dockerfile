FROM node:24-alpine@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53
WORKDIR /app
LABEL org.opencontainers.image.title="Daily Food Diary" \
      org.opencontainers.image.description="Food diary, exercise plans and a SQLite catalog of 108 recipes" \
      org.opencontainers.image.source="https://github.com/HajayYang/Daily-Food-Diary" \
      org.opencontainers.image.licenses="MIT"
ENV NODE_ENV=production
COPY --chown=node:node *.js *.css *.png *.svg *.webmanifest index.html package.json food-cache.json LICENSE ./
COPY --chown=node:node data/ ./data/
COPY --chown=node:node database/api.js ./database/api.js
COPY --chown=node:node vendor/sqljs/ ./vendor/sqljs/
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/recipes/meta').then(async r=>{if(!r.ok||(await r.json()).total<1)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
