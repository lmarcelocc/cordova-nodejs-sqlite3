const AuthDetails = require('../models/auth-details');
const userService = require('../services/user-service');
const loginLimiter = require('../middlewares/rate-limit').loginLimiter;
const jwt = require('jsonwebtoken');
// singleton to store authdetails at runtime
const authService = require('../services/auth-service');
//initialised once here...
authService.init();
/**
 * user entry routes
 */
module.exports = (express) => {
  var apiRoutes = express.Router();
  // check a user has been registered
  apiRoutes.get('/init', async function (req, res, next) {
    try {
      authService.authDetails.userRegistered = await userService.userExists();
      // handle session here
      res.end(JSON.stringify(authService.authDetails));
    } catch (e) {
      // bubble exception up to express
      next(e);
    }
  });
  // protect route with login limiter
  apiRoutes.post('/login', loginLimiter, async function (req, res, next) {
    try {
      const data = req.body;
      // validate password
      const userResponse = await userService.isValidUser(data.props.password);
      if (userResponse.success) {
        if (userResponse.data) {
          // reset login rate limit protection
          loginLimiter.resetKey(req.ip);
          authService.authDetails.authState = true;
          // store the password to be used for encryption/decryption
          // during this session
          // Create a secret token for this session to secure requests
          // {expiresIn: '2h'} for session management
          // init the private key used to create the jwt token
          authService.authDetails.token = jwt.sign({ userID: 'gafAdminUser' }, authService.jwtSecret);
          authService.key = data.props.password;
          res.end(JSON.stringify(authService.authDetails));
        } else {
          res.status(403).end('Invalid Password');
        }
      } else {
        res.status(userResponse.responseCode).end(userResponse.message);
      }
    } catch (e) {
      next(e);
    }
  });
  // logout
  apiRoutes.post('/logout', async function (req, res, next) {
    try {
      await authService.logout();
      // handle session here
      res.end(JSON.stringify(authService.authDetails));
    } catch (e) {
      // bubble exception up to express
      next(e);
    }
  });
  apiRoutes.post('/register', async function (req, res, next) {
    try {
      const data = req.body;
      const userResponse = await userService.register(data.props.password);
      if (userResponse.success) {
        const token = jwt.sign({ userID: 'gafAdminUser' }, authService.jwtSecret);
        authService.authDetails = new AuthDetails(true, true, null, token);
        authService.key = data.props.password;
        res.end(JSON.stringify(authService.authDetails));
      } else {
        res.status(userResponse.responseCode).end(JSON.stringify(userResponse));
      }
    } catch (e) {
      next(e);
    }
  });

  return apiRoutes;
};
