/**
 * Created by Vadym Yatsyuk on 13/06/16
 */

var express = require('express');
var router = express.Router();

var Mark = require('./../marks/Mark.model');
var Tag = require('./Tag.model');
var helper = require('./../helper');

router.get('/sites/:site/marks/:id/tags', (req, res) => {
  Mark.findOneAsync({ _id: req.params.id })
    .then(helper.handleNotFound(res))
    .then(mark => {
      var filter = {
        mark: mark._id,
        access: 'public'
      };
  
      Object.assign(filter, helper.accessFilter(req));
  
      Tag.findAsync(filter)
        .then(helper.handleResponse(res))
        .catch(helper.handleError(res));
    })
    .catch(helper.handleError(res));
});

router.post('/sites/:site/marks/:id/tags', (req, res) => {
  Mark.findOneAsync({ _id: req.params.id })
    .then(helper.handleNotFound(res))
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
        .catch(helper.handleError(res));
    })
    .catch(helper.handleError(res));
});

module.exports = router;