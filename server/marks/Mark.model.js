/**
 * Created by Vadym Yatsyuk on 13/06/16
 */

var bluebird = require('bluebird');
var mongoose = bluebird.promisifyAll(require('mongoose'));

module.exports = mongoose.model('Mark', {
  text: String,
  xPath: String,
  site: String,
  access: String,
  user: String,
  group: String,
  created: {
    type: Date,
    default: Date.now
  }
});