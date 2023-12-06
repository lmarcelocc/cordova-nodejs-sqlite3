const fs = require('fs');
const cordova = require('cordova-bridge');
const GAFMBTile = require('../models/mbtile');
const ServiceResponse = require('../models/service-response');
const MBTiles = require('@mapbox/mbtiles');

const GAFMBTileLoadingState = {
  PENDING: 1,
  LOADED: 2,
  FAILED: 3,
};

const files = [];
let filesNotLoaded = [];

exports.hasLoadedAllMBtilesFiles = () =>
  files.filter((o) => o.state == GAFMBTileLoadingState.FAILED || o.state == GAFMBTileLoadingState.LOADED).length == files.length;

exports.initialize = (express, directory) => {
  // routes list
  const mbRoutes = [];
  // API router
  const apiRoutes = express.Router();
  // MBTiles base directory
  const MBTILES_BASE_DIR = directory + 'mbtiles/';

  let hasMbtilesFolder = true;

  // Endpoint that exposes the dynamic loaded routes
  apiRoutes.get('/mbroutes', function (req, res) {
    const response = new ServiceResponse();
    response.success = true;
    response.data = mbRoutes;
    response.filesNotLoaded = filesNotLoaded;
    res.end(JSON.stringify(response));
  });

  if (!fs.existsSync(MBTILES_BASE_DIR)) {
    cordova.channel.send('mbtiles directory not found');
    hasMbtilesFolder = false;
    // return apiRoutes;
  }
  // raster/         # raster mbtiles ("png")
  // OSMVector/      # open street maps vector data ("pbf")

  try {
    // Get all raster file paths
    if (hasMbtilesFolder) {
      // Get all raster file paths
      fs.readdirSync(MBTILES_BASE_DIR + 'raster/').forEach((rasterDBPath) => {
        if (rasterDBPath.endsWith('.mbtiles')) {
          const mbtile = new GAFMBTile();
          mbtile.format = 'raster';
          mbtile.dbPath = 'raster/' + rasterDBPath;
          mbtile.state = GAFMBTileLoadingState.PENDING;
          mbtile.name = rasterDBPath.slice(0, -8);
          files.push(mbtile);
        }
      });

      // Get all vector file paths
      fs.readdirSync(MBTILES_BASE_DIR + 'OSMVector/').forEach((vectorDBPath) => {
        if (vectorDBPath.endsWith('.mbtiles')) {
          const mbtile = new GAFMBTile();
          mbtile.format = 'vector';
          mbtile.dbPath = 'OSMVector/' + vectorDBPath;
          mbtile.name = vectorDBPath.slice(0, -8);
          mbtile.state = GAFMBTileLoadingState.PENDING;
          files.push(mbtile);
        }
      });
    }

    // Nodejs vector/raster assets folders
    const nodejsVectorMbtilesAssetsFolder = __dirname + '/../assets/initialData/mbtiles/vector';
    const nodejsRasterMbtilesAssetsFolder = __dirname + '/../assets/initialData/mbtiles/raster';

    try {
      // Get all vector file paths
      fs.readdirSync(nodejsVectorMbtilesAssetsFolder).forEach((vectorDBPath) => {
        cordova.channel.send('vectorDBPath#1 ' + vectorDBPath);

        if (fs.existsSync(nodejsVectorMbtilesAssetsFolder + '/' + vectorDBPath)) {
          cordova.channel.send('vectorDBPath_FILE_EXISTS');
        } else {
          cordova.channel.send('vectorDBPath_FILE_NOT_EXIST');
        }

        if (vectorDBPath.endsWith('.mbtiles')) {
          const mbtile = new GAFMBTile();
          mbtile.format = 'vector';
          mbtile.dbPath = nodejsVectorMbtilesAssetsFolder + '/' + vectorDBPath;
          mbtile.name = vectorDBPath.slice(0, -8);
          mbtile.state = GAFMBTileLoadingState.PENDING;
          mbtile.isInitialData = true;

          files.push(mbtile);
        }
      });
    } catch (e) {
      cordova.channel.send('INITIAL_DATA_ERROR_#1: ' + JSON.stringify(e));
    }

    try {
      // Get all raster file paths
      fs.readdirSync(nodejsRasterMbtilesAssetsFolder).forEach((rasterDBPath) => {
        cordova.channel.send('rasterDBPath#2 ' + rasterDBPath);

        if (fs.existsSync(nodejsRasterMbtilesAssetsFolder + '/' + rasterDBPath)) {
          cordova.channel.send('rasterDBPathh_FILE_EXISTS');
        } else {
          cordova.channel.send('rasterDBPath_FILE_NOT_EXIST');
        }

        if (rasterDBPath.endsWith('.mbtiles')) {
          const mbtile = new GAFMBTile();
          mbtile.format = 'raster';
          mbtile.dbPath = nodejsRasterMbtilesAssetsFolder + '/' + rasterDBPath;
          mbtile.name = rasterDBPath.slice(0, -8);
          mbtile.state = GAFMBTileLoadingState.PENDING;
          mbtile.isInitialData = true;

          files.push(mbtile);
        }
      });
    } catch (e) {
      cordova.channel.send('INITIAL_DATA_ERROR_#2: ' + JSON.stringify(e));
    }

    let counter = -1;
    cordova.channel.send('FILES: ' + JSON.stringify(files));
    files.forEach((element) => {
      const mbcounter = ++counter;
      const uniq = 'id' + new Date().getTime();

      const finalName = mbcounter + uniq;

      let mbTilesPath;
      if (element.isInitialData) {
        mbTilesPath = element.dbPath;
      } else {
        mbTilesPath = 'file://' + directory + 'mbtiles/' + element.dbPath;
      }

      cordova.channel.send('mbtiles creating route for: ' + mbTilesPath);

      new MBTiles(mbTilesPath, (err, mbtiles) => {
        cordova.channel.send('MBTILES_ERROR: ' + JSON.stringify(err));
        cordova.channel.send('MBTILES_DATA: ' + JSON.stringify(element));

        if (err) {
          cordova.channel.send('mbtiles error: ' + err);
          element.state = GAFMBTileLoadingState.FAILED;
          return;
        }

        mbtiles.getInfo((err, info) => {
          if (err) {
            filesNotLoaded.push(element.name);
          }

          element.info = info;
          element.route = '/mbtiles' + finalName;
          element.state = GAFMBTileLoadingState.LOADED;
          mbRoutes.push(element);
        });

        apiRoutes.get('/mbtiles' + finalName + '/:z/:x/:y.*', (req, res) => {
          const extension = req.param(0);
          if (extension.indexOf('grid.json') != -1) {
            mbtiles.getGrid(req.param('z'), req.param('x'), req.param('y'), (err, grid, headers) => {
              if (err) {
                res.status(404).send('Grid rendering error: ' + err + '\n');
              } else {
                res.header('Content-Type', 'text/json');
                res.send(grid);
              }
            });
          } else if (extension.indexOf('png') != -1 || extension.indexOf('pbf') != -1) {
            mbtiles.getTile(req.param('z'), req.param('x'), req.param('y'), (err, grid, headers) => {
              if (err) {
                res.status(404).send('Grid rendering error: ' + err + '\n');
              } else {
                for (const [key, val] of Object.entries(headers)) {
                  res.header(key, val);
                }
                res.send(grid);
              }
            });
          }
        });
      });
    });
    return apiRoutes;
  } catch (e) {
    cordova.channel.send('mbtiles loading error: ' + JSON.stringify(e));
  }
};
