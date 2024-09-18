FROM --platform=linux/amd64 golang:1.21.3-bullseye AS build-go
WORKDIR /opt/build
COPY . .
RUN curl -LO https://github.com/tinygo-org/tinygo/releases/download/v0.30.0/tinygo_0.30.0_amd64.deb && dpkg -i tinygo_0.30.0_amd64.deb
RUN cd hello-go && tinygo build -target=wasi -gc=leaking -no-debug -o main.wasm main.go

FROM scratch
COPY --from=build-go /opt/build/spin.toml .
COPY --from=build-go /opt/build/hello-go/main.wasm ./hello-go/main.wasm
