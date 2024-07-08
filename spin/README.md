Hello Spin(WebAssebly) on Local k8s
========================================

* WSL
* kubectl
* helm
* docker-ce はインストール済み（省略）

https://www.spinkube.dev/docs/overview/


初期設定
----------------------

### k3dのインストール
https://k3d.io/
minikubeやkindと同様の、ローカルk8s環境
WSL上でOK。

```sh
wget -q -O - https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash
```

### Spinのインストール
https://developer.fermyon.com/spin/v2/quickstart

```sh
curl -fsSL https://developer.fermyon.com/downloads/install.sh | bash
sudo mv ./spin /usr/local/bin/spin
```

Spin Kubeプラグインのインストール
```sh
spin plugins update
spin plugins install -y kube
```


### Wasmビルド用の言語Rust, Go(TiniyGo)のインストール

#### Rust
```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.bashrc
rustup target add wasm32-wasi
```


#### (Tiny)Go

Goのインストール
https://go.dev/doc/install

rootで

```sh
wget https://go.dev/dl/go1.21.11.linux-amd64.tar.gz
rm -rf /usr/local/go && tar -C /usr/local -xzf go1.21.11.linux-amd64.tar.gz
export PATH=$PATH:/usr/local/go/bin

# 必要に応じて
# echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
```

TinyGoのインストール
https://tinygo.org/getting-started/install/linux/

```sh
wget https://github.com/tinygo-org/tinygo/releases/download/v0.32.0/tinygo_0.32.0_amd64.deb
sudo dpkg -i tinygo_0.32.0_amd64.deb
```

### Containerd Image Storeの有効化

https://docs.docker.com/storage/containerd/

```sh
sudo sh -c 'cat << EOF >> /etc/docker/daemon.json
{
  "features": {
    "containerd-snapshotter": true
  }
}
EOF'
```


### k3dクラスタの作成

https://www.spinkube.dev/docs/spin-operator/quickstart/

```sh
# ローカルレジストリの作成
k3d registry create registry.localhost --port 5000

# クラスタの作成
k3d cluster create wasm-cluster \
  --image ghcr.io/spinkube/containerd-shim-spin/k3d:v0.14.1 \
  --port "8081:80@loadbalancer" \
  --agents 1 \
  --registry-use k3d-registry.localhost:5000

# 自前イメージの場合
k3d cluster create wasm-cluster \
  --image k3swithshims:latest \
  --port "8081:80@loadbalancer" \
  --agents 1 \
  --registry-use k3d-registry.localhost:5000
```


Instana Agentのために、machine-id を適当に作りに行く
```sh
docker exec -it k3d-wasm-cluster-agent-0 /bin/sh -c "od -An -tx4 -N16 /dev/random | tr -d ' ' > /etc/machine-id"
docker exec -it k3d-wasm-cluster-server-0 /bin/sh -c "od -An -tx4 -N16 /dev/random | tr -d ' ' > /etc/machine-id"
```

Datadog Agentのために、 /etc/passwdを適当に作りにいく（うまくいかない・・・）
```sh
docker exec -it k3d-wasm-cluster-agent-0 /bin/sh -c "echo 'root:x:0:0:root:/root:/bin/sh' > /etc/passwd"
docker exec -it k3d-wasm-cluster-server-0 /bin/sh -c "echo 'root:x:0:0:root:/root:/bin/sh' > /etc/passwd"

```

**Podが全てRunning/Completedになるまで待ったほうが良い**

### Spin Operatorのインストール

基本はココ: https://www.spinkube.dev/docs/spin-operator/quickstart/

（クラスタの作成だけ異なる）

```sh
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.3/cert-manager.yaml
```

**Podが全てRunning/Completedになるまで待ったほうが良い**

```sh
kubectl apply -f https://github.com/spinkube/spin-operator/releases/download/v0.2.0/spin-operator.runtime-class.yaml
kubectl apply -f https://github.com/spinkube/spin-operator/releases/download/v0.2.0/spin-operator.crds.yaml
helm install spin-operator \
  --namespace spin-operator \
  --create-namespace \
  --version 0.2.0 \
  --wait \
  oci://ghcr.io/spinkube/charts/spin-operator
kubectl apply -f https://github.com/spinkube/spin-operator/releases/download/v0.2.0/spin-operator.shim-executor.yaml
```

Spin ビルド&デプロイ
---------------------

### アプリケーションのビルド(Wasmファイルの作成)
```sh
spin build
```

```sh
# イメージをデプロイ
# -k は insecure（証明書エラー回避）のため
spin registry push -k localhost:5000/wasm-spin:latest

# アプリデプロイ
spin kube deploy --from k3d-registry.localhost:5000/wasm-spin:latest
```


* spinapp というCRDからDeploymentが作成されているので、spinappを消さない限り、deploymentを消してもしぶとく蘇ってくる
* runtimeClassを指定すれば動作するので、 `kubectl apply -f spin.yaml` でも同様に起動可能

アクセス確認
--------------------------

```sh
kubectl port-forward svc/wasm-spin 8083:80
```

```sh
curl localhost:8083/rust
curl localhost:8083/go
```


片付け
-----------------

クラスタの削除

```sh
k3d cluster delete wasm-cluster
```

レジストリの削除
```sh
k3d registry delete myregistry.localhost
```

その他、メモ
----------------------


### AKSにデプロイする場合（未解決）

```sh
# Azure Container Registryでアクセスキーを作成する
# TOKEN=
spin registry login -u tamura -p $TOKEN tamura.azurecr.io
spin registry push tamura.azurecr.io/wasm-spin:latest
```

*AKSだと runtimeclassが wasmtime-spin-v1 しかなくて、これだと動かなかった*


### Google Artifact Registryにpushする

```sh
cat key.json | base64 -w0 | spin registry login -u _json_key_base64 --password-stdin https://asia-docker.pkg.dev
```
-> 動かない・・・



```sh
PASS=$(cat sre-rc-0e9272e54f68.json | base64 -w0)
sudo ctr -n moby  images push -u "_json_key_base64:$PASS" asia-docker.pkg.dev/sre-rc/containers/mandelbrot/wasm-spin:latest
```
-> pushできた！


### ローカルでもWasmイメージ動かせないのか？

Containerd Image Storeの有効化

https://docs.docker.com/storage/containerd/


* docker pullはできるようになった
```sh
$ docker pull localhost:5000/wasm-spin:latest
latest: Pulling from wasm-spin
Digest: sha256:517911ca622abf2d7ff4adcc4f847b121f58762b6fb6179663a2e10862fb6a45
Status: Image is up to date for localhost:5000/wasm-spin:latest
localhost:5000/wasm-spin:latest
```
-> しかし、docker images では何故か見えない
* これまでのイメージやコンテナが全く見えなくなった

spin registryコマンドで作成されたイメージがこうなる模様。
docker でビルドしたwasmイメージは見えて起動もできた

* wasmイメージは、ctrで見れた
```sh
sudo ctr --namespace moby images ls
```

https://docs.docker.com/engine/alternative-runtimes/

```sh
wget https://github.com/spinkube/containerd-shim-spin/releases/download/v0.14.1/containerd-shim-spin-v2-linux-x86_64.tar.gz
tar -zxvf containerd-shim-spin-v2-linux-x86_64.tar.gz
sudo mv ./containerd-shim-spin-v2 /usr/local/bin/
```

```sh
docker run --rm \
 --runtime io.containerd.spin.v2 \
 --platform wasi/wasm \
 localhost:5000/wasm-spin:latest
 ghcr.io/spinkube/containerd-shim-spin/examples/spin-rust-hello:v0.13.0
```
->

```sh
Unable to find image 'ghcr.io/spinkube/containerd-shim-spin/examples/spin-rust-hello:v0.13.0' locally
v0.13.0: Pulling from spinkube/containerd-shim-spin/examples/spin-rust-hello
Digest: sha256:ae7d03c04102437d9dd0dc2605c7b4112611d9c49fea1042b64f817fcaca512b
Status: Image is up to date for ghcr.io/spinkube/containerd-shim-spin/examples/spin-rust-hello:v0.13.0
docker: Error response from daemon: No such image: ghcr.io/spinkube/containerd-shim-spin/examples/spin-rust-hello:v0.13.0.
```
 -> 動かない・・・ (なぜpullはできるのに No such image？)

### Dockerでwasmイメージをビルドする

Dockerfileは↓を参考に作成。

https://github.com/spinkube/containerd-shim-spin/blob/main/images/spin/Dockerfile


ビルド
```sh
docker buildx build --provenance=false --no-cache --platform=wasi/wasm -t localhost:5000/wasm-spin:latest .
```

shimのインストール
```sh
wget https://github.com/spinkube/containerd-shim-spin/releases/download/v0.14.1/containerd-shim-spin-v2-linux-x86_64.tar.gz
tar -zxvf containerd-shim-spin-v2-linux-x86_64.tar.gz
sudo mv ./containerd-shim-spin-v2 /usr/local/bin/
```

起動
```sh
docker run --rm  --runtime io.containerd.spin.v2 \
  --platform wasi/wasm  \
  localhost:5000/wasm-spin:latest /
```

GARへpush
```sh
docker tag localhost:5000/wasm-spin:latest asia-docker.pkg.dev/sre-rc/containers/mandelbrot/wasm-spin:latest
docker push asia-docker.pkg.dev/sre-rc/containers/mandelbrot/wasm-spin:latest
```

