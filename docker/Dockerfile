FROM node:9
RUN apt-get update && \
  apt-get install -y default-jre curl git ssh tar gzip ca-certificates && \
  apt-get autoremove && \
  apt-get clean
RUN npm install -g nyc release-it
