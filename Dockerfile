FROM node:22-alpine

WORKDIR /srv
COPY . /srv

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "server.js"]
