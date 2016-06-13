/**
 * Created by Vadym Yatsyuk on 13/06/16
 */

var mongoose = require('mongoose');

module.exports = mongoose.model('Tag', {
  text: String,
  mark: String,
  access: String,
  user: String,
  group: String,
  created: { type: Date, default: Date.now }
});