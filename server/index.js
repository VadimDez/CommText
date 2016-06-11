/**
 * Created by Vadym Yatsyuk on 11/06/16
 */

var express = require('express');
var app = express();

app.get('/', (req, res) => {
  res.end();
});

app.listen(8888, function () {
  console.log('Server started');
});