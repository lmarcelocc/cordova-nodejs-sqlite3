import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  constructor(private platform: Platform) {
    let serverTarget = 'main.js';
    this.platform.ready().then(() => {
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
    });
  }

  /**
   * Nodejs channel listener
   * Attempts to parse the message as json
   * Fails silently and logs non json msg
   * @param msg
   */
  channelListener(msg: string) {
    try {
      console.info(msg);
    } catch (error) {
      console.log('Error parsing json msg' + error);
      console.log('[cordova] received:' + msg);
    }
  }


  click1(): void {
    console.log('click 1');
    nodejs.channel.post(' CARAIIIII ');
    nodejs.channel.send(' CARAIIIII#22222 ');
  }

}
