/**
 * Created by Vadym Yatsyuk on 11/06/16
 */

var express = require('express');
var app = express();
var PORT = process.env.PORT || 8888;

app.get('/', (req, res) => {
  res.end();
});

app.post('/marks', (req, res) => {
  res.send({link: '/marks/1'});
});

app.listen(PORT, () => {
  console.log('Server started');
});