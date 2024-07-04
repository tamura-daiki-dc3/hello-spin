FROM --platform=${BUILDPLATFORM} rust:1.79 AS build
WORKDIR /opt/build
COPY . .
RUN cd hello-rust && rustup target add wasm32-wasi && cargo build --target wasm32-wasi --release

FROM --platform=linux/amd64 golang:1.21.3-bullseye AS build-go
WORKDIR /opt/build
COPY . .
RUN curl -LO https://github.com/tinygo-org/tinygo/releases/download/v0.30.0/tinygo_0.30.0_amd64.deb && dpkg -i tinygo_0.30.0_amd64.deb
RUN cd hello-go && tinygo build -target=wasi -gc=leaking -no-debug -o main.wasm main.go
RUN cd healthz && tinygo build -target=wasi -gc=leaking -no-debug -o main.wasm main.go

FROM scratch
COPY --from=build /opt/build/hello-rust/target/wasm32-wasi/release/hello_rust.wasm ./hello-rust/target/wasm32-wasi/release/hello_rust.wasm
COPY --from=build /opt/build/spin.toml .
COPY --from=build-go /opt/build/hello-go/main.wasm ./hello-go/main.wasm
COPY --from=build-go /opt/build/healthz/main.wasm ./healthz/main.wasm