var express = require('express');
var router = express.Router();

const { createCanvas, createImageData } = require('canvas')

/* GET users listing. */
router.get('/', function (req, res, next) {

  const x_min = -1.5, y_min = -1.0, x_max = +0.5, y_max = +1.0;
  const width = 1200, height = 1200;
  const max_iter = 1 << 7 - 1


  var canvas = generateMandelbrotSet(width, height, x_min, x_max, y_min, y_max, max_iter);
  const buffer = canvas.toBuffer('image/jpeg')



  res.writeHead(200, { 'content-type': 'image/jpeg' });
  res.end(buffer, 'binary')
});

const isDiverged = function (x0, y0, max_iter) {
  let xn = 0.0;
  let yn = 0.0;
  for (let i = 1; i < max_iter; i++) {
    let x_next = xn * xn - yn * yn + x0;
    let y_next = 2.0 * xn * yn + y0;
    xn = x_next;
    yn = y_next;
    if (yn * yn + xn * xn > 4.0) {
      return i;
    }
  }
  return max_iter;
};

const generateMandelbrotSet = function (
  canvasWidth,
  canvasHeight,
  x_min,
  x_max,
  y_min,
  y_max,
  max_iter,
) {
  var canvas = createCanvas(canvasWidth, canvasHeight);
  var ctx = canvas.getContext('2d');

  var imagedata = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

  for (let i = 0; i < canvasHeight; i++) {
    let y = y_min + (y_max - y_min) * i / canvasHeight;
    for (let j = 0; j < canvasWidth; j++) {
      let x = x_min + (x_max - x_min) * j / canvasWidth;
      let iter_index = isDiverged(x, y, max_iter);
      let v = iter_index % 8 * 32

      var index = (i * canvasWidth + j) * 4;
      imagedata.data[index] = v; // R
      imagedata.data[index + 1] = v; // G
      imagedata.data[index + 2] = v; // B
      imagedata.data[index + 3] = 255; // A

    }
  }

  ctx.putImageData(imagedata, 0, 0);
  return canvas;
};


module.exports = router;
