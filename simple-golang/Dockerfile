FROM golang:1.21 as build

WORKDIR /go/src/app
COPY go.* ./
RUN go mod download

COPY . .
RUN go vet -v
RUN go test -v
RUN CGO_ENABLED=0 go build -o /go/bin/app

FROM scratch
COPY --from=build /go/bin/app /
CMD ["/app"]