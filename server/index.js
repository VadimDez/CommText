/**
 * Created by Vadym Yatsyuk on 11/06/16
 */

var express = require('express');
var app = express();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

var PORT = process.env.PORT || 8888;

mongoose.connect('mongodb://' + process.env.MONGODB);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var Mark = require('./marks/Mark.model');
var Tag = require('./tags/Tag.model');
var Comment = require('./comments/Comment.model');

/**
 * Create filter based on access
 * @param req
 * @returns {{}}
 */
const accessFilter = (req) => {
  var filter = {};
  if (req.query.access !== 'private') {
    return filter;
  }

  filter.access = 'private';

  if (req.query.group) {
    filter.group = req.query.group;
  } else {
    filter.user = req.query.user;
  }

  return filter;
};


app.get('/', (req, res) => {
  res.end();
});

app.use('/sites/:site/marks', require('./marks/marks.controller'));

app.use('/sites/:site/marks/:id/comments', require('./comments/comments.controller'));

app.use('/sites/:site/marks/:id/tags', require('./tags/tags.controller'));

app.listen(PORT, () => {
  console.log(`Server started on port: ${ PORT }`);
});