FROM node:14

WORKDIR /spotihue

COPY package.json package.json
COPY packages/app/package.json packages/app/package.json
COPY packages/server/package.json packages/server/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY yarn.lock yarn.lock
COPY .yarn/releases .yarn/releases
COPY .yarnrc.yml .yarnrc.yml

RUN yarn install --immutable --inline-builds

COPY . .

RUN yarn build

CMD yarn server:start