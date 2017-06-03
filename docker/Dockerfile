FROM node:7.10
RUN apt-get update && \
  apt-get install -y default-jre curl git ssh && \
  npm install -g nyc && \
  apt-get autoremove && \
  apt-get clean
