/**
 * Created by Vadym Yatsyuk on 13/06/16
 */

const ACCESS_PRIVATE = 'private';

/**
 * Create filter based on access
 * @param req
 * @returns {{}}
 */
const accessFilter = (req) => {
  var filter = {};
  
  if (req.query.access !== ACCESS_PRIVATE) {
    return filter;
  }

  filter.access = ACCESS_PRIVATE;

  if (req.query.group) {
    filter.group = req.query.group;
  } else {
    filter.user = req.query.user;
  }

  return filter;
};

module.exports = {
  accessFilter: accessFilter
};