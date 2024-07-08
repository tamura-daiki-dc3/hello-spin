FROM node:20-slim AS build-env
COPY . /app
WORKDIR /app
RUN npm ci --omit=dev

# For Canvas
RUN cp /usr/lib/x86_64-linux-gnu/libuuid.so.1 node_modules/canvas/build/Release/ \
    && cp /usr/lib/x86_64-linux-gnu/libmount.so.1 node_modules/canvas/build/Release/ \
    && cp /usr/lib/x86_64-linux-gnu/libblkid.so.1 node_modules/canvas/build/Release/

FROM gcr.io/distroless/nodejs20-debian12
ENV NODE_ENV production
COPY --from=build-env /app /app
WORKDIR /app
CMD ["./bin/www"]
