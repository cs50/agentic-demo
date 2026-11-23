# The hub: one Node process that serves the built deck (dist/, built in CI)
# and the audience websocket (server/). Built by Elastic Beanstalk on an
# arm64 instance from the bundle the GitHub workflow uploads, so the base
# image must be multi-arch (the official node images are).
#
# Not a Passenger/nginx base image: that would sit between the load balancer
# and the websocket for no benefit. Plain Node is all the hub needs.

FROM node:24-alpine

ENV NODE_ENV=production \
    PORT=8080

WORKDIR /app

# The server's only dependency is `ws`. Install it from the lockfile first so
# this layer is cached across deploys that only change slides.
COPY server/package.json server/pnpm-lock.yaml ./server/
RUN npm install --global pnpm@11 \
    && cd server \
    && pnpm install --prod --frozen-lockfile --ignore-workspace \
    && npm uninstall --global pnpm \
    && npm cache clean --force

COPY server ./server
COPY dist ./dist

EXPOSE 8080
USER node

CMD ["node", "--experimental-strip-types", "server/index.ts"]
