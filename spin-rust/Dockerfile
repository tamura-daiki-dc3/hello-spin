FROM --platform=${BUILDPLATFORM} rust:1.79 AS build
WORKDIR /opt/build
COPY . .
RUN cd hello-rust && rustup target add wasm32-wasi && cargo build --target wasm32-wasi --release

FROM scratch
COPY --from=build /opt/build/hello-rust/target/wasm32-wasi/release/hello_rust.wasm ./hello-rust/target/wasm32-wasi/release/hello_rust.wasm
COPY --from=build /opt/build/spin.toml .
