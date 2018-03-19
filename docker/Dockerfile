FROM node:9.5.0
RUN apt-get update && \
  apt-get install -y default-jre curl git ssh && \
  apt-get autoremove && \
  apt-get clean
RUN npm install -g nyc conventional-changelog-cli
