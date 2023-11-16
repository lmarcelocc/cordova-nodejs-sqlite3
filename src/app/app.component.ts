import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor(private readonly platform: Platform) {
    this.platform.ready().then(() => {
      this.startNodeProject();
    });
  }


  // In this example the channel listener handles only two types of messages:
  // - the 'Reply' object type that is defined in the www/nodejs-project/main.js
  // - the string type
  // But any other valid JavaScript type can be handled if desired.
  channelListener(msg: any) {
    if (typeof msg === 'string') {
      console.log('[cordova] MESSAGE from Node: "' + msg + '"');
    } else if (typeof msg === 'object') {
      console.log('[cordova] MESSAGE from Node: "' + msg.reply + '" - In reply to: "' + msg.original + '"');
    } else {
      console.log('[cordova] unexpected object type: ' + typeof msg);
    }
  };

  // Events listener
  startedEventistener(msg: any) {
    if (msg) {
      if (typeof msg === 'string') {
        console.log('[cordova] "STARTED" event received from Node with a message: "' + msg + '"');
      } else if (typeof msg === 'object') {
        // Add your own logic there
      } else {
        console.log('[cordova] "unexpected object type: ' + typeof msg);
      }
    } else {
      console.log('[cordova] "STARTED" event received from Node');
    }
  };

  // This is the callback passed to 'nodejs.start()' to be notified if the Node.js
  // engine has started successfully.
  startupCallback(err: any) {
    if (err) {
      console.log(err);
    } else {
      console.log ('Node.js Mobile Engine started');
      // Send a message to the Node.js app. The reply from the Node.js app will be
      // processed by the message channel listener 'channelListener()`.
      nodejs.channel.send('Hello from Cordova!');

      // Send a sample event to the Node.js app.
      nodejs.channel.post('myevent', 'An event from Cordova');
    }
  };

  // The entry point to start the Node.js app.
  startNodeProject() {
    // Register the callbacks for the message channel and for the events channel
    // before starting the Node.js engine.
    nodejs.channel.setListener(this.channelListener);
    nodejs.channel.on('started', this.startedEventistener);

    // As an alternative to 'nodejs.channel.setListener', the 'nodejs.channel.on'
    // method can be used:
    // nodejs.channel.on('message', channelListener);

    // Start the Node.js for Mobile Apps engine, passing the main script filename
    // and a callback to receive the result of the startup process.
    nodejs.start('main.js', this.startupCallback);
    // To disable the stdout/stderr redirection to the Android logcat:
    // nodejs.start('main.js', startupCallback, { redirectOutputToLogcat: false });
  };
}
