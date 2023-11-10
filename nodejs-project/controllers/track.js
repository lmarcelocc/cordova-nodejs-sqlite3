var formidable = require('formidable');
const ServiceResponse = require('../models/service-response');
var fs = require('fs');
const cordova = require('cordova-bridge');

/**
 * track entry routes
 */
module.exports = (express) => {
  var apiRoutes = express.Router();

  const temporaryTrackBackupDirectory = `${cordova.app.datadir()}/temp/`;
  const trackBackupFileName = 'temp_track_backup';

  cordova.channel.on('update_track', (msg) => {
    try {
      if (!fs.existsSync(temporaryTrackBackupDirectory)) {
        fs.mkdirSync(temporaryTrackBackupDirectory);
      }
      // Persist fields.track
      fs.writeFileSync(temporaryTrackBackupDirectory + trackBackupFileName, msg);
    } catch (e) {
      cordova.channel.send('Error in track post' + e);
    }
  });

  apiRoutes.get('/', function (req, res, next) {
    // Validate if any track file was stored and return it to the FE
    const response = new ServiceResponse();
    if (fs.existsSync(temporaryTrackBackupDirectory + trackBackupFileName)) {
      fs.readFile(temporaryTrackBackupDirectory + trackBackupFileName, (err, data) => {
        response.data = JSON.parse(data.toString());
        // Delete backup file after warning the FE
        fs.unlinkSync(temporaryTrackBackupDirectory + trackBackupFileName);
        response.success = true;
        res.end(JSON.stringify(response));
      });
    } else {
      response.success = true;
      res.end(JSON.stringify(response));
    }
  });

  apiRoutes.delete('/', function (req, res) {
    var response = new ServiceResponse();
    // Remove track from backup
    if (fs.existsSync(temporaryTrackBackupDirectory + trackBackupFileName)) {
      fs.unlinkSync(temporaryTrackBackupDirectory + trackBackupFileName);
    }
    response.success = true;
    res.end(JSON.stringify(response));
  });

  return apiRoutes;
};
