/**
 * Created by Vadym Yatsyuk on 13/06/16
 */
var express = require('express');
var router = express.Router();

var Mark = require('./../marks/Mark.model');
var Comment = require('./Comment.model');
var helper = require('./../helper');


router.get('/sites/:site/marks/:id/comments', (req, res) => {
  var filter = {
    _id: req.params.id,
    access: 'public'
  };

  Object.assign(filter, helper.accessFilter(req));

  Mark.findOneAsync(filter)
    .then(helper.handleNotFound(res))
    .then(mark => {
      Comment.findAsync({ mark: mark._id })
        .then(helper.handleResponse(res))
        .catch(helper.handleError(res));
    })
    .catch(helper.handleError(res));
});

router.post('/sites/:site/marks/:id/comments', (req, res) => {
  Mark.findOneAsync({ _id: req.params.id })
    .then(helper.handleNotFound(res))
    .then(mark => {
      
      (new Comment({
        text: req.body.comment,
        mark: mark._id,
        access: req.body.access,
        user: req.body.user,
        group: req.body.group
      }))
        .saveAsync()
        .then(helper.handleResponse(res, 201))
        .catch(helper.handleError(res));
    })
    .catch(helper.handleError(res));
});

module.exports = router;