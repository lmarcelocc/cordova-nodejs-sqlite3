var formidable = require('formidable');
const cordova = require('cordova-bridge');
const ServiceResponse = require('../models/service-response');
const fs = require('fs');
const auth = require('../middlewares/auth');
const expressJwt = require('express-jwt');
const cryptoService = require('../services/crypto-service');
// singleton to store authdetails at runtime
const authService = require('../services/auth-service');
/**
 * utils entry routes
 */
module.exports = (express) => {
  var apiRoutes = express.Router();

  apiRoutes.post('/decrypt', [auth.isAuthorized, expressJwt({ secret: authService.jwtSecret })], function (req, res) {
    var response = new ServiceResponse();
    var form = new formidable.IncomingForm();
    form.parse(req, function (parsingerror, fields, files) {
      var props = JSON.parse(fields.props);
      try {
        cryptoService.decryptMediaFile(props.source, props.destination, authService.key);
        response.success = true;
        res.end(JSON.stringify(response));
      } catch (e) {
        response.success = false;
        response.message = e;
        res.end(JSON.stringify(response));
      }
    });
  });

  apiRoutes.post('/encrypt', [auth.isAuthorized, expressJwt({ secret: authService.jwtSecret })], function (req, res) {
    var response = new ServiceResponse();
    var form = new formidable.IncomingForm();
    form.parse(req, function (parsingerror, fields, files) {
      var props = JSON.parse(fields.props);
      cryptoService.encryptMediaFile(props.source, props.destination, authService.key);
      fs.unlink(props.source, (deleteOriginalFileError) => {
        if (deleteOriginalFileError) {
          response.success = false;
          response.message = deleteOriginalFileError;
          cordova.channel.send('Deleting original video file error: ' + deleteOriginalFileError);
          res.end(JSON.stringify(response));
        }
        response.success = true;
        res.end(JSON.stringify(response));
      });
    });
  });

  apiRoutes.post('/createfile', [auth.isAuthorized, expressJwt({ secret: authService.jwtSecret })], function (req, res) {
    var response = new ServiceResponse();
    var form = new formidable.IncomingForm();
    form.parse(req, function (parsingerror, fields, files) {
      var props = JSON.parse(fields.props);
      cordova.channel.send('Creating image file for encryption to: ' + props.destination);
      cryptoService.createMediaFile(props.file, props.destination);
      response.success = true;
      res.end(JSON.stringify(response));
    });
  });

  return apiRoutes;
};
