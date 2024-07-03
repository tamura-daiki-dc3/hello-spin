```sh
docker build -t k3d-registry.localhost:5000/golang:latest .
docker push k3d-registry.localhost:5000/golang:latest


kubectl apply -f k8s.yaml
```