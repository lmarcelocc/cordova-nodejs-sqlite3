var fs = require('fs');
var url = require('url');
var request = require('request');
const cordova = require('cordova-bridge');

module.exports = (express, argv, yargs) => {
  var apiRoutes = express.Router();

  var gzipHeader = Buffer.from('1F8B08', 'hex');

  if (argv.help) {
    return yargs.showHelp();
  }

  // eventually this mime type configuration will need to change
  // https://github.com/visionmedia/send/commit/d2cb54658ce65948b0ed6e5fb5de69d022bef941
  var mime = express.static.mime;
  mime.define({
    'application/json': ['czml', 'json', 'geojson', 'topojson'],
    'model/vnd.gltf+json': ['gltf'],
    'model/vnd.gltf.binary': ['glb'],
    'application/octet-stream': ['b3dm', 'pnts', 'i3dm', 'cmpt'],
    'text/plain': ['glsl'],
  });

  function checkGzipAndNext(req, res, next) {
    var buffer = Buffer.alloc(3);
    var reqUrl = url.parse(req.url, true);
    var filePath = reqUrl.pathname.substring(1);

    var readStream = fs.createReadStream(filePath, { start: 0, end: 2 });
    readStream.on('error', function (err) {
      next();
    });

    readStream.on('data', function (chunk) {
      if (chunk.equals(gzipHeader)) {
        res.header('Content-Encoding', 'gzip');
      }
      next();
    });
  }

  var knownTilesetFormats = [/\.b3dm/, /\.pnts/, /\.i3dm/, /\.cmpt/, /\.glb/, /tileset.*\.json$/];
  apiRoutes.get(knownTilesetFormats, checkGzipAndNext);

  // Custom code for serving TilesetWithExpiration. When points.pnts is requested it cycles between the tiles in the cache folder.
  var expirationPntsPath = '/tilesets/TilesetWithExpiration/points.pnts';
  var expirationCacheDirectory = '/tilesets/TilesetWithExpiration/cache/';
  var expirationCacheLength = 5;
  var expireCount = 0;

  apiRoutes.use(expirationPntsPath, function (req, res) {
    var pntsPath = expirationCacheDirectory + 'points_' + expireCount + '.pnts';
    expireCount = (expireCount + 1) % expirationCacheLength;
    res.sendFile(pntsPath, { root: __dirname });
    // Don't call next() because we don't need to run the express.static middleware
  });

  function getRemoteUrlFromParam(req) {
    var remoteUrl = req.params[0];
    if (remoteUrl) {
      // add http:// to the URL if no protocol is present
      if (!/^https?:\/\//.test(remoteUrl)) {
        remoteUrl = 'http://' + remoteUrl;
      }
      remoteUrl = url.parse(remoteUrl);
      // copy query string
      remoteUrl.search = url.parse(req.url).search;
    }
    return remoteUrl;
  }

  var dontProxyHeaderRegex = /^(?:Host|Proxy-Connection|Connection|Keep-Alive|Transfer-Encoding|TE|Trailer|Proxy-Authorization|Proxy-Authenticate|Upgrade)$/i;

  function filterHeaders(req, headers) {
    var result = {};
    // filter out headers that are listed in the regex above
    Object.keys(headers).forEach(function (name) {
      if (!dontProxyHeaderRegex.test(name)) {
        result[name] = headers[name];
      }
    });
    return result;
  }

  var upstreamProxy = argv['upstream-proxy'];
  var bypassUpstreamProxyHosts = {};
  if (argv['bypass-upstream-proxy-hosts']) {
    argv['bypass-upstream-proxy-hosts'].split(',').forEach(function (host) {
      bypassUpstreamProxyHosts[host.toLowerCase()] = true;
    });
  }

  apiRoutes.get('/proxy/*', function (req, res, next) {
    // look for request like http://localhost:8080/proxy/http://example.com/file?query=1
    var remoteUrl = getRemoteUrlFromParam(req);
    if (!remoteUrl) {
      // look for request like http://localhost:8080/proxy/?http%3A%2F%2Fexample.com%2Ffile%3Fquery%3D1
      remoteUrl = Object.keys(req.query)[0];
      if (remoteUrl) {
        remoteUrl = url.parse(remoteUrl);
      }
    }

    if (!remoteUrl) {
      return res.send(400, 'No url specified.');
    }

    if (!remoteUrl.protocol) {
      remoteUrl.protocol = 'http:';
    }

    var proxy;
    if (upstreamProxy && !(remoteUrl.host in bypassUpstreamProxyHosts)) {
      proxy = upstreamProxy;
    }

    // encoding : null means "body" passed to the callback will be raw bytes

    request.get(
      {
        url: url.format(remoteUrl),
        headers: filterHeaders(req, req.headers),
        encoding: null,
        proxy: proxy,
      },
      function (error, response, body) {
        var code = 500;

        if (response) {
          code = response.statusCode;
          res.header(filterHeaders(req, response.headers));
        }

        res.send(code, body);
      }
    );
  });

  return apiRoutes;
};
