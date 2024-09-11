package main

import (
	"fmt"
	"net/http"

	spinhttp "github.com/fermyon/spin/sdk/go/v2/http"
)

func init() {
	spinhttp.Handle(func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("Handling request to %v", r.Header.Get("spin-full-url"))
		w.Header().Set("Content-Type", "text/plain")
		fmt.Fprintln(w, "OK")
	})
}

func main() {}
