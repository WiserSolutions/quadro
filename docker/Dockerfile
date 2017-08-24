FROM node:8.4.0

RUN apt-get update && \
  apt-get install -y default-jre curl git ssh && \
  apt-get install -y python-dev python-pip jq && \
  apt-get autoremove && \
  apt-get clean

RUN pip install awscli==1.11.115

RUN npm install npm@latest && \
  rm -rf /usr/local/lib/node_modules/npm && \
  mv node_modules/npm /usr/local/lib/node_modules/npm && \
  npm install -g nyc

ENV DOCKER_VERSION 17.03.0-ce

RUN curl -L "https://get.docker.com/builds/Linux/x86_64/docker-$DOCKER_VERSION.tgz" -o "/tmp/docker-$DOCKER_VERSION.tgz" \
  && tar -xz -C /tmp -f "/tmp/docker-$DOCKER_VERSION.tgz" && mv /tmp/docker/* /usr/local/bin
