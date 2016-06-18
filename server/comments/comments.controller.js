/**
 * Created by Vadym Yatsyuk on 13/06/16
 */
var express = require('express');
var router = express.Router();

var Mark = require('./../marks/Mark.model');
var Comment = require('./Comment.model');
var helper = require('./../helper');

function handleError(res, statusCode) {
  return () => {
    res.status(statusCode || 400).end();
  }
}

function handleNotFound(res) {
  return entity => {
    if (!entity) {
      res.status(404).end();
      return null;
    }
    
    return entity;
  }
}

function handleResponse(res, statusCode) {
  return entity => {
    res.status(statusCode || 200).json(entity);
  }
}

router.get('/sites/:site/marks/:id/comments', (req, res) => {
  var filter = {
    _id: req.params.id,
    access: 'public'
  };

  Object.assign(filter, helper.accessFilter(req));

  Mark.findOneAsync(filter)
    .then(handleNotFound(res))
    .then(mark => {
      Comment.findAsync({ mark: mark._id })
        .then(handleResponse(res))
        .catch(handleError(res));
    })
    .catch(handleError(res));
});

router.post('/sites/:site/marks/:id/comments', (req, res) => {
  Mark.findOneAsync({ _id: req.params.id })
    .then(handleNotFound(res))
    .then(mark => {
      (new Comment({
        text: req.body.comment,
        mark: mark._id,
        access: req.body.access,
        user: req.body.user,
        group: req.body.group
      }))
        .saveAsync()
        .then(handleResponse(res, 201))
        .catch(handleError(res));
    })
    .catch(handleError(res));
});

module.exports = router;