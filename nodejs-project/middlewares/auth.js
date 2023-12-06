// singleton to store authdetails at runtime
const authService = require('../services/auth-service');
module.exports.isAuthorized = function (req, res, next) {
  if (authService.key === null || !authService.authDetails.authState) {
    var err = new Error('Not authorized!');
    err.status = 401;
    return next(err);
  } else {
    return next();
  }
};
