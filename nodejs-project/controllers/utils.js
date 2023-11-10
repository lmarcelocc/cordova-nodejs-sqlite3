var formidable = require('formidable');
const cordova = require('cordova-bridge');
const cryptoService = require('../services/crypto-service');
const ServiceResponse = require('../models/service-response');
const AuthDetails = require('../models/auth-details');
const fs = require('fs');

/**
 * utils entry routes
 */
module.exports = (express) => {
  var apiRoutes = express.Router();

  apiRoutes.get('/init', async function (req, res, next) {
    try {
      // unsecure version just send back defaults
      var authDetails = new AuthDetails(true, true, 'user-password-here');
      // handle session here
      res.end(JSON.stringify(authDetails));
    } catch (e) {
      // bubble exception up to express
      next(e);
    }
  });

  apiRoutes.post('/decrypt', function (req, res) {
    var response = new ServiceResponse();
    var form = new formidable.IncomingForm();
    form.parse(req, function (parsingerror, fields, files) {
      var props = JSON.parse(fields.props);
      try {
        cryptoService.decryptMediaFile(props.source, props.destination, 'passw0rd');
        response.success = true;
        res.end(JSON.stringify(response));
      } catch (e) {
        response.success = false;
        response.message = e;
        res.end(JSON.stringify(response));
      }
    });
  });

  apiRoutes.post('/encrypt', function (req, res) {
    var response = new ServiceResponse();
    var form = new formidable.IncomingForm();
    form.parse(req, function (parsingerror, fields, files) {
      var props = JSON.parse(fields.props);
      cryptoService.encryptMediaFile(props.source, props.destination, 'passw0rd');
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

  apiRoutes.post('/createfile', function (req, res) {
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
