// Require the 'cordova-bridge' to enable communications between the
// Node.js app and the Cordova app.
const cordova = require('cordova-bridge');
const sqlite3 = require('sqlite3').verbose();

var db = new sqlite3.Database(':memory:');

db.serialize(function() {
  db.run("CREATE TABLE lorem (info TEXT)");

  var stmt = db.prepare("INSERT INTO lorem VALUES (?)");
  for (var i = 0; i < 10; i++) {
      stmt.run("Ipsum " + i);
  }
  stmt.finalize();

  db.all("SELECT rowid AS id, info FROM lorem", function(err, rows) {
    var result = '';
    rows.forEach((row) =>
      result += row.id + ": " + row.info + "\n"
    );
    cordova.channel.send(
      "sqlite3 output:\n" +
      result
    )
  });

});

db.close();

// Send a message to Cordova.
cordova.channel.send('main.js loaded');

// Post an event to Cordova.
cordova.channel.post('started');

// Post an event with a message.
cordova.channel.post('started', 'main.js loaded');

// A sample object to show how the channel supports generic
// JavaScript objects.
class Reply {
  constructor(replyMsg, originalMsg) {
    this.reply = replyMsg;
    this.original = originalMsg;
  }
};

// Listen to messages from Cordova.
cordova.channel.on('message', (msg) => {
  console.log('[node] MESSAGE received: "%s"', msg);
  // Reply sending a user defined object.
  cordova.channel.send(new Reply('Message received!', msg));
});

// Listen to event 'myevent' from Cordova.
cordova.channel.on('myevent', (msg) => {
  console.log('[node] MYEVENT received with message: "%s"', msg);
});

// Handle the 'pause' and 'resume' events.
// These are events raised automatically when the app switched to the
// background/foreground.
cordova.app.on('pause', (pauseLock) => {
  console.log('[node] app paused.');
  pauseLock.release();
});

cordova.app.on('resume', () => {
  console.log('[node] app resumed.');
  cordova.channel.post('engine', 'resumed');
});
