var fs = require('fs');
const dree = require('dree');
const cordova = require('cordova-bridge');
const request = require('request');

class CordovaService {
  constructor() {
    //Create default collected data directory
    this.initializeCollectedMediaDirectory();
    this.removeUnencryptedFiles();
    this.setAppListners();
  }

  setChannelListners(app, express, mbtilesController, server, geojsonController) {
    const _this = this;
    cordova.channel.on('directory', (msg) => {
      cordova.channel.send('Collected data internal assets directory: ' + cordova.app.datadir());
      cordova.channel.send('Base directory: ' + msg);
      app.use(express.static(msg));
      app.use(mbtilesController.initialize(express, msg));

      app.use('/geojson', geojsonController.initialize(express, msg));
    });

    cordova.channel.on('login', (msg) => {
      _this.postRequest('http://localhost:' + server.address().port + '/login', 'LOGIN_USER', msg);
    });

    cordova.channel.on('register', (msg) => {
      _this.postRequest('http://localhost:' + server.address().port + '/register', 'REGISTER_USER', msg);
    });

    cordova.channel.on('kill_server', () => {
      _this.removeUnencryptedFiles();
      server.close(function () {
        process.exit(0);
      });
    });
  }

  setAppListners() {
    cordova.app.on('pause', (pauseLock) => {
      console.log('[node] app paused.');
      pauseLock.release();
    });

    cordova.app.on('resume', () => {
      console.log('[node] app resumed.');
      cordova.channel.post('engine', 'resumed');
    });
  }

  initializeCollectedMediaDirectory() {
    let dir = cordova.app.datadir() + '/CD';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  }

  removeUnencryptedFiles() {
    let dir = cordova.app.datadir() + '/CD';
    dree.scan(dir, { extensions: ['mp3', 'mp4', 'png', 'jpg'] }, (file) => {
      fs.unlinkSync(file.path);
    });
  }

  postRequest(path, reqType, msg) {
    // request the api route on the prot we are listening
    request.post(
      {
        url: path,
        auth: {
          bearer: 'bearerToken',
        },
        form: {
          props: {
            password: msg,
          },
        },
      },
      function (err, httpResponse, body) {
        const message = {
          type: reqType,
          statusCode: httpResponse.statusCode,
          body: body,
          error: err,
        };
        cordova.channel.send(JSON.stringify(message));
      }
    );
  }
}
// create a singleton instance for lifescycle of server
module.exports = new CordovaService();
