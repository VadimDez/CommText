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

module.exports = {
  accessFilter: accessFilter,
  handleError: handleError,
  handleNotFound: handleNotFound,
  handleResponse: handleResponse
};