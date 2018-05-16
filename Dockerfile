FROM node:alpine

ENV PATH /root/.yarn/bin:$PATH

RUN mkdir -p /app/current

RUN apk update \
  && apk add curl bash binutils tar \
  && rm -rf /var/cache/apk/* \
  && /bin/bash \
  && touch ~/.bashrc \
  && curl -o- -L https://yarnpkg.com/install.sh | bash 

ADD . /app/current

WORKDIR /app/current

ENV NODE_ENV=production
ENV PORT=3000

RUN yarn install --production

EXPOSE 3000

CMD ["yarn", "start"] 

