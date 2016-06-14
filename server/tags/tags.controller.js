/**
 * Created by Vadym Yatsyuk on 13/06/16
 */

var express = require('express');
var router = express.Router();

var Mark = require('./../marks/Mark.model');
var Tag = require('./Tag.model');
var helper = require('./../helper');


router.get('/sites/:site/marks/:id/tags', (req, res) => {
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

    Object.assign(filter, helper.accessFilter(req));

    Tag.find(filter, (err, tags) => {
      if (err) {
        return res.status(400).end();
      }

      res.send(tags);
    });
  });
});

router.post('/sites/:site/marks/:id/tags', (req, res) => {
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

module.exports = router;