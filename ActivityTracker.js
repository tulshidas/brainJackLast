const ioHook = require('iohook');
const monitor = require('./active-window');
const request = require('request');
const config = require('./config');


module.exports = class ActivityTracker {
    constructor(userId) {
        this.activeWindowList = [];
        
        this.lastAwinObj = {};
        this.lastAwinObj.title = '';
        this.lastAwinObj.app = '';

        this.idleFrameStartTime = this.getDateTime(new Date);
        this.totalSeconds = 0;
        this._usreId = userId;
        this.startIdleTime = false;
        // If user idle more than 3 min, then calculate idle time 
        this.maxIdleTime = 180;
        setInterval( () => this.setTime(), 1000);
    }

    setTime() {
        ++this.totalSeconds;
        console.log('maxIdleTime: '+ this.maxIdleTime);
        console.log('totalSeconds: '+ this.totalSeconds);

        if (this.totalSeconds > this.maxIdleTime && !this.startIdleTime) {
            this.eventHandler();
        }
    }

    end(){
        if (ioHook){
            ioHook.stop();
        }
        if (monitor){
            monitor.end();
        }
    }

    resetIdleTimer() {
        this.idleFrameStartTime = this.getDateTime(new Date);
        this.totalSeconds = 0;
    }

    eventHandler(event){
        console.log('in eventHandler:')
        if (this.totalSeconds > this.maxIdleTime && !this.startIdleTime) {
            this.closeLastActiveWindow(new Date);
            this.startIdleTime = true;
            this.totalSeconds = 0;
        } else if( this.startIdleTime ){ 
            this.resetIdleTimer();
            this.createNewActiveWindow( this.lastAwinObj  , new Date );
            this.startIdleTime = false;
        }
        else {
            console.log('in else:');
            this.resetIdleTimer();
        }
    }


    callApi(appdata) {
        var userActivity = {};
        userActivity.appData = appdata;
        userActivity.idleTime = [];
        userActivity.userId = this._usreId;
        // userActivity.date = this.getDateTime(new Date(),'dateonly');

        var reqBody = this.enctypt(JSON.stringify(userActivity));
        (function post(attempt) {
            console.log('Api called ... ');
            // console.dir(userActivity);

            request({
                url: config.dataDumpUrl,
                method: "POST",
                json: true,   // <--Very important!!!
                body: reqBody
            }, function (error, response, body) {                    
                    if (error) {
                    // so error happened
                    // for now, we will retry in every 30 seconds for 30 minutes
                    console.error('error posting activity data. attempt: ' + attempt, error);
                    if (attempt < 60) {
                        setTimeout(function () {
                            post(++attempt);
                        }, 30 * 1000);
                    } else {
                        console.error('max retry attempt exceeded for activity data. attempt: ' + attempt, reqBody);
                    }
                }
            });
        })(0);
    }

    twoDigit(i) {
        return ( +i < 10 ) ?  "0" + i : i;
    }

    getDateTime(today, type = null) {
        let date = today.getFullYear()  + '-' +  this.twoDigit( today.getMonth() + 1 ) + '-' + this.twoDigit( today.getDate() );
        return type == 'dateonly' ? date : today.getTime();
    }

    createNewActiveWindow(awin,today){
        awin.start = this.getDateTime(today);
        awin.end = this.getDateTime(today);
        this.activeWindowList.push(awin);
    }

    closeLastActiveWindow(today){
        // As previous window finished 1 sec before, so 2nd param is 1
        // previous -1 logic is removed
        this.activeWindowList[this.activeWindowList.length - 1].end = this.getDateTime(today);  
        this.activeWindowList[this.activeWindowList.length - 1].app; 
        this.callApi(this.activeWindowList.pop());   
        this.activeWindowList = [];
    }

    callback(awin) {
        try {
            awin.app = awin.name || awin.app;
            if (this.lastAwinObj.title !== awin.title && !this.startIdleTime) {

                var today = new Date();
                if (this.activeWindowList.length > 0) {
                    this.closeLastActiveWindow(today);
                }
                this.createNewActiveWindow(awin,today);
                // console.dir( JSON.stringify( activeWindowList ) );
            }

            this.lastAwinObj = awin;
        } catch (err) {
            console.log(err);
        }
    }

    start() {

        ioHook.start();
        ioHook.on('mouseclick', event => this.eventHandler(event));
        ioHook.on('keypress', event => this.eventHandler(event));
        ioHook.on('mousewheel', event => this.eventHandler(event));
        ioHook.on('mousemove', event => this.eventHandler(event));

        monitor.getActiveWindow(event => this.callback(event), -1, 1);
    }

    enctypt(text) {
        var crypto = require('crypto');
        var key = '00000000000000000000000000000000'; //replace with your key
        var iv = '0000000000000000'; //replace with your IV
        var cipher = crypto.createCipheriv('aes256', key, iv)
        var crypted = cipher.update(text, 'utf8', 'base64')
        crypted += cipher.final('base64');
        return crypted;
    }
}

