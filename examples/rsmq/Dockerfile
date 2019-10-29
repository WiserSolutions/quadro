FROM node:12-alpine

COPY . /app
WORKDIR /app
EXPOSE 3090

RUN npm install --quiet

CMD ["/usr/bin/npm", "start-producer"]