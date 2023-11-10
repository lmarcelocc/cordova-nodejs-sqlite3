'use strict';
const cordova = require('cordova-bridge');
var express = require('express');
var app = express();
var cors = require('cors');
// this constructs a new cordova service and inits
const cordovaService = require('./services/cordova-service');

app.use(express.json());
app.use(express.urlencoded()); // support encoded bodies
app.use(cors());

var yargs = require('yargs').options({
  port: {
    default: process.env.PORT || 3000,
    description: 'Port to listen on.',
  },
  public: {
    type: 'boolean',
    description: 'Run a public server that listens on all interfaces.',
  },
  'upstream-proxy': {
    description: 'A standard proxy server that will be used to retrieve data.  Specify a URL including port, e.g. "http://proxy:8000".',
  },
  'bypass-upstream-proxy-hosts': {
    description: 'A comma separated list of hosts that will bypass the specified upstream_proxy, e.g. "lanhost1,lanhost2"',
  },
  help: {
    alias: 'h',
    type: 'boolean',
    description: 'Show this help.',
  },
});

var argv = yargs.argv;

var mbtilesController = require('./controllers/mbtiles');
app.use(require('./controllers/tilesets')(express, argv, yargs));
app.use(require('./controllers/user.js')(express));
app.use(require('./controllers/utils-secure.js')(express));
app.use('/track', require('./controllers/track.js')(express));
var geojsonController = require('./controllers/geojsons');

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

var server = app.listen(argv.port, argv.public ? undefined : 'localhost', () => {
  var interval = setInterval(
    (controller, bridge) => {
      if (controller.hasLoadedAllMBtilesFiles()) {
        // bridge.channel.send("server running on port: " + server.address().port);
        const message = {
          type: 'SERVER_READY',
          apiUrl: server.address().port,
          serverReady: true,
        };
        bridge.channel.send(JSON.stringify(message));
        clearInterval(interval);
      }
    },
    200,
    mbtilesController,
    cordova
  );
});

server.on('error', function (e) {
  if (e.code === 'EADDRINUSE') {
    console.log('Error: Port %d is already in use, select a different port.', argv.port);
    console.log('Example: node server.js --port %d', argv.port + 1);
  } else if (e.code === 'EACCES') {
    console.log('Error: This process does not have permission to listen on port %d.', argv.port);
    if (argv.port < 1024) {
      console.log('Try a port number higher than 1024.');
    }
  }
  console.log(e);
  process.exit(1);
});

server.on('close', function () {
  console.log('Cesium development server stopped.');
});

//call the cordova service to set all the channel listners for our app
cordovaService.setChannelListners(app, express, mbtilesController, server, geojsonController);

process.on('SIGINT', function () {
  server.close(function () {
    process.exit(0);
  });
});

module.exports = app;
