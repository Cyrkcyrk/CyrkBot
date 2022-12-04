FROM node:16.9.1

ENV NODE_ENV=production
WORKDIR /app

COPY ["package.json", "."]
RUN npm install --production

CMD ["npm", "run", "start"]
