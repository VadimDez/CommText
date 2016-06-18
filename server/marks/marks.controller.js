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

  Mark.findAsync(filter)
    .then(helper.handleResponse(res))
    .catch(helper.handleError(res));
});

router.post('/sites/:site/marks', (req, res) => {
  (new Mark({
    site: req.params.site,
    text: req.body.text,
    xPath: req.body.xPath,
    access: req.body.access,
    user: req.body.user,
    group: req.body.group
  }))
    .saveAsync()
    .then(helper.handleResponse(res))
    .catch(helper.handleError(res));
});


router.delete('/sites/:site/marks/:id', (req, res) => {
  Mark.removeAsync({ _id: req.params.id })
    .then(() => {
      res.status(204).end();
    })
    .catch(helper.handleError(res));
});

module.exports = router;