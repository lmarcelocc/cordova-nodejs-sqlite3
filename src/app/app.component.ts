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
      this.startNodeJS('server.js');
    });
  }

  startNodeJS(serverTarget: string): any {
    console.log('Attempting to start node server: ' + serverTarget);
      // To disable the stdout/stderr redirection to the Android logcat:
      // nodejs.start('main.js', startupCallback, { redirectOutputToLogcat: false });
      nodejs.channel.setListener((msg: any) => {
        this.channelListener(msg);
      });

      nodejs.start(serverTarget, (err: any) => {
        if (err) {
         console.error(err);
         return;
        }

        console.log('started node server: ' + serverTarget);
      });
  }

  /**
   * Nodejs channel listener
   * Attempts to parse the message as json
   * Fails silently and logs non json msg
   * @param msg
   */
  channelListener(msg: any) {
    try {
      console.log(msg);
      const jsonMessage = JSON.parse(msg);
      this.handleJsonFromBridge(jsonMessage);
    } catch (error) {
      console.log('Error parsing json msg' + error);
      console.log('[cordova] received:' + msg);
    }
  }

  /**
   * Private helper to act on different types of
   * json messages received from the cordova bridge
   * @param jsonMessage
   */
  private handleJsonFromBridge(jsonMessage: any) {
    switch (jsonMessage.type) {
      case 'SERVER_READY':
        console.log('[cordova] received:' + jsonMessage);
        break;
      default:
        console.log('[cordova] received:' + jsonMessage);
        break;
    }
  }
}
