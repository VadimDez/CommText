/**
 * Created by Vadym Yatsyuk on 13/06/16
 */

var express = require('express');
var router = express.Router();

var Mark = require('./../marks/Mark.model');
var Tag = require('./Tag.model');
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

router.get('/sites/:site/marks/:id/tags', (req, res) => {
  Mark.findOneAsync({ _id: req.params.id })
    .then(handleNotFound(res))
    .then(mark => {
      var filter = {
        mark: mark._id,
        access: 'public'
      };
  
      Object.assign(filter, helper.accessFilter(req));
  
      Tag.findAsync(filter)
        .then(handleResponse(res))
        .catch(handleError(res));
    })
    .catch(handleError(res));
});

router.post('/sites/:site/marks/:id/tags', (req, res) => {
  Mark.findOneAsync({ _id: req.params.id })
    .then(handleNotFound(res))
    .then(mark => {
      var tags = [];
      req.body.tags.forEach((tag) => {
        tags.push({
          text: tag,
          mark: mark._id,
          access: req.body.access,
          user: req.body.user,
          group: req.body.group
        });
      });
  
      Tag.createAsync(tags)
        .then(() => {
          return res.status(201).end();
        })
        .catch(handleError(res));
    })
    .catch(handleError(res));
});

module.exports = router;