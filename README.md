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


### k3dクラスタの作成

https://www.spinkube.dev/docs/spin-operator/quickstart/

```sh
# ローカルレジストリの作成
k3d registry create myregistry.localhost --port 12345

# クラスタの作成
k3d cluster create wasm-cluster \
  --image ghcr.io/spinkube/containerd-shim-spin/k3d:v0.14.1 \
  --port "8081:80@loadbalancer" \
  --agents 2 \
  --registry-use k3d-myregistry.localhost:12345
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

ビルド&デプロイ
---------------------

### アプリケーションのビルド(Wasmファイルの作成)
```sh
spin build
```

```sh
# イメージをデプロイ
# -k は insecure（証明書エラー回避）のため
spin registry push -k localhost:12345/hello-spin:latest

# アプリデプロイ
spin kube deploy --from k3d-myregistry.localhost:12345/hello-spin:latest
```


* spinapp というCRDからDeploymentが作成されているので、spinappを消さない限り、deploymentを消してもしぶとく蘇ってくる
* runtimeClassを指定すれば動作するので、 `kubectl apply -f spin.yaml` でも同様に起動可能

### AKSにデプロイする場合（未解決）

```sh
# Azure Container Registryでアクセスキーを作成する
# TOKEN=
spin registry login -u tamura -p $TOKEN tamura.azurecr.io
spin registry push tamura.azurecr.io/hello-spin:latest
```

*AKSだと runtimeclassが wasmtime-spin-v1 しかなくて、これだと動かなかった*




アクセス確認
--------------------------

```sh
kubectl port-forward svc/hello-spin 8083:80
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