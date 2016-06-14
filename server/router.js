/**
 * Created by Vadym Yatsyuk on 14/06/16
 */

var express = require('express');
var router = express.Router();

router.use('/sites/:site/marks', require('./marks/marks.controller'));

router.use('/sites/:site/marks', require('./comments/comments.controller'));

router.use('/sites/:site/marks', require('./tags/tags.controller'));

router.get('/', (req, res) => {
  res.end();
});

module.exports = router;