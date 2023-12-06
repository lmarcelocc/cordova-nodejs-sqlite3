const rateLimit = require('express-rate-limit');

// Enable if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
// see https://expressjs.com/en/guide/behind-proxies.html
// app.set('trust proxy', 1);

// can use below to protect entire app
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 5, // start blocking after 5 requests
  message: 'Too many attempts to login. Please try again ',
});

module.exports = {
  apiLimiter: apiLimiter,
  loginLimiter: loginLimiter,
};
