FROM node:8.4.0
RUN apt-get update && \
  apt-get install -y default-jre curl git ssh && \
  apt-get autoremove && \
  apt-get clean
RUN npm install npm@5.2.0 && \
  rm -rf /usr/local/lib/node_modules/npm && \
  mv node_modules/npm /usr/local/lib/node_modules/npm && \
  npm install -g nyc
