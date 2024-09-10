package main

import (
	"fmt"
	"image"
	"image/color"
	"net/http"
	"time"
)

func main() {
	http.HandleFunc("/go/jpeg", get_mandelbrot)
	http.HandleFunc("/", func(w http.ResponseWriter, req *http.Request) {
		fmt.Fprintln(w, "OK!")
	})
	err := http.ListenAndServe(":3000", nil)
	for err != nil {
		fmt.Printf("error: %s\r\n", err.Error())
		time.Sleep(5 * time.Second)
	}
}

func get_mandelbrot(w http.ResponseWriter, req *http.Request) {
	const (
		xmin, ymin, xmax, ymax = -1.5, -1.0, +0.5, +1.0
		width, height          = 2400, 2400
		max_iter               = 1<<7 - 1
	)
	img := generate_mandelbrot_img(width, height, xmin, xmax, ymin, ymax, max_iter)

	// NOTE: 計測のため、エンコードはコメントアウト

	// w.Header().Set("content-type", "image/jpeg")
	// jpeg.Encode(w, img, &jpeg.Options{Quality: 100}) // NOTE: ignoring errors
	fmt.Fprintf(w, "mandelbrot!, %v", img.Rect.Size())
}

func get_n_diverged(x0 float64, y0 float64, max_iter int) int {
	xn := .0
	yn := .0

	for i := 0; i < max_iter; i++ {
		x_next := xn*xn - yn*yn + x0
		y_next := 2.0*xn*yn + y0
		xn = x_next
		yn = y_next

		if xn*xn+yn*yn > 4.0 {
			return i
		}

	}

	return max_iter
}

func generate_mandelbrot_img(canvas_w int, canvas_h int, x_min float64, x_max float64, y_min float64, y_max float64, max_iter int) *image.RGBA {

	img := image.NewRGBA(image.Rect(0, 0, canvas_w, canvas_w))

	for i := 0; i < canvas_h; i++ {
		y := y_min + (y_max-y_min)*float64(i)/float64(canvas_h)

		for j := 0; j < canvas_w; j++ {
			x := x_min + (x_max-x_min)*float64(j)/float64(canvas_w)
			iter_index := get_n_diverged(x, y, max_iter)
			v := iter_index % 8 * 32

			img.Set(j, i, color.Gray{uint8(v)})
		}
	}

	return img

}
