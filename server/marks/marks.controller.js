/**
 * Created by Vadym Yatsyuk on 13/06/16
 */

var express = require('express');
var router = express.Router();
var Mark = require('./Mark.model');
var helper = require('./../helper');

router.get('/sites/:site/marks', (req, res) => {
  var filter = {
    site: req.params.site,
    access: 'public'
  };

  Object.assign(filter, helper.accessFilter(req));

  Mark.find(filter, (err, marks) => {

    if (err) {
      return res.status(400)
        .end();
    }

    res.send(marks);
  });
});

router.post('/sites/:site/marks', (req, res) => {
  (new Mark({
    site: req.params.site,
    text: req.body.text,
    xPath: req.body.xPath,
    access: req.body.access,
    user: req.body.user,
    group: req.body.group
  })).save((err, mark) => {
    if (err) {
      return res.status(400)
        .end();
    }

    res.send(mark);
  });
});


router.delete('/sites/:site/marks/:id', (req, res) => {

  Mark.remove({ _id: req.params.id }, (err, mark) => {
    if (err) {
      return res.status(400).end();
    }

    res.status(200).end();
  });
});

module.exports = router;