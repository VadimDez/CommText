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

app.get('/sites/:site/marks/:id/comments', (req, res) => {
  var filter = {
    _id: req.params.id,
    access: 'public'
  };

  Object.assign(filter, accessFilter(req));

  Mark.findOne(filter, (err, mark) => {
    if (err) {
      return res.status(400).end();
    }

    if (!mark) {
      return res.status(404).end();
    }

    Comment.find({ mark: mark._id }, (err, comments) => {
      if (err) {
        return res.status(400).end();
      }

      res.send(comments);
    });
  });
});

app.post('/sites/:site/marks/:id/comments', (req, res) => {
  Mark.findOne({ _id: req.params.id }, (err, mark) => {
    if (err) {
      return res.status(400).end();
    }

    if (!mark) {
      return res.status(404).end();
    }

    (new Comment({
      text: req.body.comment,
      mark: mark._id,
      access: req.body.access,
      user: req.body.user,
      group: req.body.group
    })).save((err, comment) => {
      if (err) {
        return res.status(400).end();
      }

      return res.send(comment);
    });
  })
});

app.get('/sites/:site/marks/:id/tags', (req, res) => {
  Mark.findOne({ _id: req.params.id }, (err, mark) => {
    if (err) {
      return res.status(400).end();
    }

    if (!mark) {
      return res.status(404).end();
    }

    var filter = {
      mark: mark._id,
      access: 'public'
    };

    Object.assign(filter, accessFilter(req));

    Tag.find(filter, (err, tags) => {
      if (err) {
        return res.status(400).end();
      }

      res.send(tags);
    });
  });
});

app.post('/sites/:site/marks/:id/tags', (req, res) => {
  Mark.findOne({ _id: req.params.id }, (err, mark) => {
    var tags = [];
    if (err) {
      return res.status(400).end();
    }

    if (!mark) {
      return res.status(404).end();
    }

    req.body.tags.forEach((tag) => {
      tags.push({
        text: tag,
        mark: mark._id,
        access: req.body.access,
        user: req.body.user,
        group: req.body.group
      });
    });
    
    Tag.create(tags, (err) => {
      if (err) {
        return res.status(400).end();
      }

      return res.status(201).end();
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server started on port: ${ PORT }`);
});