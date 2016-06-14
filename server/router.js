/**
 * Created by Vadym Yatsyuk on 14/06/16
 */

var express = require('express');
var router = express.Router();

router.use(require('./marks/marks.controller'));

router.use(require('./comments/comments.controller'));

router.use(require('./tags/tags.controller'));

router.get('/', (req, res) => {
  res.end();
});

module.exports = router;