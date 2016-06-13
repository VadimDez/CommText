/**
 * Created by Vadym Yatsyuk on 13/06/16
 */
var express = require('express');
var router = express.Router();

var Mark = require('./../marks/Mark.model');
var Comment = require('./Comment.model');
var helper = require('./../helper');

router.get('/', (req, res) => {
  var filter = {
    _id: req.params.id,
    access: 'public'
  };

  Object.assign(filter, helper.accessFilter(req));

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

router.post('/', (req, res) => {
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

module.exports = router;