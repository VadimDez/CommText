/**
 * Created by Vadym Yatsyuk on 11/06/16
 */

var express = require('express');
var app = express();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

var PORT = process.env.PORT || 8888;
var MONGODB = process.env.MONGODB || 'localhost:27017/commtext';

mongoose.connect('mongodb://' + MONGODB);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(require('./router'));

app.listen(PORT, () => {
  console.log(`Server started on port: ${ PORT }`);
});