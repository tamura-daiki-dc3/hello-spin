Hello Spin(WebAssebly) on Local k8s
========================================

* WSL
* kubectl
* helm
* docker-ce はインストール済み（省略）

https://www.spinkube.dev/docs/overview/


ディレクトリ構成
-------------------
* [simple-golang](./simple-golang/): 通常のGo実装
* [simple-nodejs](./simple-nodejs/): 通常のNode.js実装
* [spin](./spin/): spinフレームワークを利用したWebAssembly



３コンテナを起動する
---------------

### docker compose
```sh
docker compose up -d
```

### 個別
```sh
docker run -d --name wasm-spin -p 8084:80 --runtime io.containerd.spin.v2 \
  --platform wasi/wasm  \
  localhost:5000/wasm-spin:latest /

docker run -d --name simple-golang -p 8080:3000 localhost:5000/simple-golang:latest
docker run -d --name simple-nodejs -p 8082:3000 localhost:5000/simple-nodejs:latest
```
