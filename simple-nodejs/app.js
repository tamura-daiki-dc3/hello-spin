var express = require('express');

var healthzRouter = require('./routes/healthz');
var mandelbrotRouter = require('./routes/mandelbrot');

var app = express();


app.use('/', healthzRouter);
app.use('/healthz', healthzRouter);
app.use('/jpeg', mandelbrotRouter);

module.exports = app;
