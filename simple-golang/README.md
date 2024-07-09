Go実装
=====================

* 3000ポート
* `/go/jpeg`: jpeg画像を返却
* `/healthz` : ヘルスチェック(ReadinessProbe用)

```sh

docker buildx build --provenance=false --no-cache --platform=linux/amd64 -t localhost:5000/simple-golang:latest .

docker build -t localhost:5000/simple-golang:latest .
docker push localhost:5000/simple-golang:latest


docker tag localhost:5000/simple-golang:latest asia-docker.pkg.dev/sre-rc/containers/mandelbrot/simple-golang:latest
docker push asia-docker.pkg.dev/sre-rc/containers/mandelbrot/simple-golang:latest

kubectl apply -f k8s.yaml
```