const fs = require('fs');
const cordova = require('cordova-bridge');
const gafGeojson = require('../models/geojson');
const serviceResponse = require('../models/service-response');

const files = [];
let filesNotLoaded = [];

exports.initialize = (express, directory) => {
  try {
    // API router
    const apiRoutes = express.Router();
    // GeoJSON base directory
    const GEOJSON_BASE_DIR = directory + 'Vector_background_data/';

    apiRoutes.get('/', function (req, res) {
      const response = new serviceResponse();
      response.data = files;
      response.success = true;
      response.filesNotLoaded = filesNotLoaded;
      res.end(JSON.stringify(response));
    });

    if (!fs.existsSync(GEOJSON_BASE_DIR)) {
      cordova.channel.send('Vector_background_data directory not found');
      return apiRoutes;
    }
    // Get all vector file paths
    fs.readdirSync(GEOJSON_BASE_DIR).forEach((vectorDBPath) => {
      if (vectorDBPath.endsWith('.geojson')) {
        const geojsonData = new gafGeojson();
        geojsonData.dbPath = vectorDBPath;
        geojsonData.name = vectorDBPath.slice(0, -8);
        files.push(geojsonData);
      }
    });

    const filesCorrupt = [];
    files.forEach((element, index) => {
      const gjPath = directory + 'Vector_background_data/' + element.dbPath;
      console.log('gjPath   ' + gjPath);
      cordova.channel.send('geojson creating route for: ' + gjPath);

      if (!fs.existsSync(gjPath)) {
        cordova.channel.send('file not found');
        return apiRoutes;
      }

      try {
        const fileTemp = fs.readFileSync(gjPath, 'utf8');
        const temp = JSON.parse(fileTemp);
        element.data = temp;
      } catch (e) {

        filesCorrupt.push(index);
        filesNotLoaded.push(element.name);
      }
    });

    // Files corrupt should not be sent to FE
    filesCorrupt.forEach((index) => {
      files.splice(index, 1);
    });

    return apiRoutes;
  } catch (e) {
    cordova.channel.send('geojson loading error: ' + JSON.stringify(e));
  }
};
