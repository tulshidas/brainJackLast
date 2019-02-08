const path = require("path"),
  fs = require("fs"),
  //  sqlite3 = require("sqlite3").verbose(),
  sqliteDatabase = require("better-sqlite3"),
  uuidV4 = require("uuid/v4"),
  moment = require("moment"),
  copyFileSync = require("fs-copy-file-sync");
browsers = require('./browsers');

function getBrowserHistory(paths = [], browserName, historyTimeLength) {
  return (function () {
    var foundRecords;
    if (
      browserName === browsers.FIREFOX ||
      browserName === browsers.SEAMONKEY
    ) {
      foundRecords = getMozillaBasedBrowserRecords(
        paths,
        browserName,
        historyTimeLength
      );
      return foundRecords;
    } else if (
      browserName === browsers.CHROME ||
      browserName === browsers.OPERA ||
      browserName === browsers.TORCH ||
      browserName === browsers.VIVALDI
    ) {
      foundRecords = getChromeBasedBrowserRecords(
        paths,
        browserName,
        historyTimeLength
      );
      return foundRecords;
    } else if (browserName === browsers.MAXTHON) {
      foundRecords = getMaxthonBasedBrowserRecords(
        paths,
        browserName,
        historyTimeLength
      );
      //  allBrowserRecords = allBrowserRecords.concat(foundRecords);
      return foundRecords;
    } else if (browserName === browsers.SAFARI) {
      foundRecords = getSafariBasedBrowserRecords(
        paths,
        browserName,
        historyTimeLength
      );
      return foundRecords;
    } else if (browserName === browsers.INTERNETEXPLORER) {
      //Only do this on Windows we have to do t his here because the DLL manages this
      if (process.platform !== 'win32') {
        resolve()
      }
      foundRecords = getInternetExplorerBasedBrowserRecords(historyTimeLength);
      return foundRecords;
    }
  })();
}

//sqlite command for get history within specific time
//SELECT title, last_visit_time, url from urls WHERE DATETIME (last_visit_time/1000000 + (strftime('%s', '1601-01-01')), 'unixepoch')  >= DATETIME('now', '-" + historyTimeLength +" minutes')
function getChromeBasedBrowserRecords(paths, browserName, historyTimeLength) {
  return (function () {
    var browserHistory = [];
    if (!paths || paths.length === 0) {
      return browserHistory;
    }
    for (let i = 0; i < paths.length; i++) {
      if (paths[i] || paths[i] !== "") {
        if (paths[i].includes("Profile")) {
          console.log("Contains profile");
          continue;
        }
        let newDbPath = path.join(
          process.env.TMP ? process.env.TMP : process.env.TMPDIR,
          uuidV4() + ".sqlite"
        );
        copyFileSync(paths[i], newDbPath);
        // // console.log("\n\nChrome History:" + paths[i]);
        
        const db = new sqliteDatabase(newDbPath, {
          readonly: true
        });
        // const rows = db.prepare("SELECT * FROM urls").all();
        //get the last record
        //SELECT * FROM urls WHERE ID = (MAX(ID) FROM urls )
        // last 3 rec
        //  additional sqlite option:  limit 100
        const rows = db.prepare('SELECT * FROM urls ORDER BY id DESC').all();
        //console.log("rows:");
        //    console.log(rows);
        // if (
        //   row.url.split(":")[0] === "http" ||
        //   row.url.split(":")[0] === "https"
        // ) {
        //   let temp = row.url.split("/");
        //   browserHistory.push({
        //     title: row.title,
        //     url: temp[0] + temp[1] + temp[2],
        //     time: moment(row.last_visit_time / 1000).format("MMM DD, YYYY")
        //   });
        // }
        //return rows;
        for (let row of rows) {
          let temp = row.url.split("/");
          browserHistory.push({
            title: row.title,
            url: temp[1] + temp[2],
            time: moment(row.last_visit_time / 1000).format("MMM DD, YYYY")
          });
        }
        // console.log("One set done");
      }
    }
    return browserHistory;
  })(historyTimeLength);
}

function getMozillaBasedBrowserRecords(paths, browserName, historyTimeLength) {
  return (function () {
    var browserHistory = [];
    if (!paths || paths.length === 0) {
      return browserHistory;
    }
    for (let i = 0; i < paths.length; i++) {
      console.log("Try to read");
      if (paths[i] || paths[i] !== "") {
        let newDbPath = path.join(
          process.env.TMP ? process.env.TMP : process.env.TMPDIR,
          uuidV4() + ".sqlite"
        );
        copyFileSync(paths[i], newDbPath);
        console.log("\n\n\nFirefox History File Name " + paths[i]);
        const db = new sqliteDatabase(newDbPath, {
          readonly: true
        });
        const rows = db.prepare("select * from moz_places  ORDER BY id DESC limit 200").all();
        console.log("Rows: ");
        //get the last record
        //  const rows = db.prepare('SELECT * FROM moz_places WHERE ID = (SELECT MAX(ID) FROM moz_places)').get();
        //   console.log(rows);
        for (let row of rows) {

          let temp = row.url.split("/");
          browserHistory.push({
            title: row.title,
            url: temp[1] + temp[2],
            time: moment(row.last_visit_date / 1000).format("MMM DD, YYYY")
          });

        }
        console.log("Finished reding.");
      }
    }
    return browserHistory;
  })();
}


function getMaxthonBasedBrowserRecords(paths, browserName, historyTimeLength) {
  return (function () {
    var browserHistory = [];
    if (!paths || paths.length === 0) {
      return browserHistory;
    }
    for (let i = 0; i < paths.length; i++) {
      console.log("Try to read");
      if (paths[i] || paths[i] !== "") {
        let newDbPath = path.join(
          process.env.TMP ? process.env.TMP : process.env.TMPDIR,
          uuidV4() + ".sqlite"
        );
        copyFileSync(paths[i], newDbPath);
        console.log("\n\n\nMaxthon History File Name " + paths[i]);
        const db = new sqliteDatabase(newDbPath, {
          readonly: true
        });
        db.prepare("PRAGMA wal_checkpoint(FULL)").run();
        const rows = db
          .prepare(
            "SELECT * FROM zmxhistoryentry"
          )
          .all();
        console.log("Rows: ");
        //console.log(rows);
        // for (let row of rows) {
        //   if(row.url.split(':')[0] === "http" || row.url.split(':')[0] === "https"){
        //     let temp = row.ZURL.split('/');
        //     browserHistory.push({
        //       url: temp[0] + temp[1]+ temp[2],
        //       time: moment(row.ZLASTVISITTIME/1000).format('MMM DD, YYYY')
        //     });
        //   }
        // }
        console.log("Finished reding.");
      }
    }
    return browserHistory;
  })();
}


function getSafariBasedBrowserRecords(paths, browserName, historyTimeLength) {
  return (function () {
    var browserHistory = [];
    if (!paths || paths.length === 0) {
      return browserHistory;
    }
    for (let i = 0; i < paths.length; i++) {
      console.log("Try to read");
      if (paths[i] || paths[i] !== "") {
        let newDbPath = path.join(
          process.env.TMP ? process.env.TMP : process.env.TMPDIR,
          uuidV4() + ".sqlite"
        );
        copyFileSync(paths[i], newDbPath);
        console.log("\n\n\nSafari History File Name " + paths[i]);
        const db = new sqliteDatabase(newDbPath, {
          readonly: true
        });
        db.prepare("PRAGMA wal_checkpoint(FULL)").run();
        const rows = db
          .prepare(
            "SELECT i.id, i.url, v.title, v.visit_time FROM history_items i INNER JOIN history_visits v on i.id = v.history_item"
          )
          .all();
        console.log("Rows: ");
        console.log(rows);
        // for (let row of rows) {
        //   if(row.url.split(':')[0] === "http" || row.url.split(':')[0] === "https"){
        //     let temp = row.url.split('/');
        //     browserHistory.push({
        //       url: temp[0] + temp[1]+ temp[2],
        //       time: moment(row.last_visit_date/1000).format('MMM DD, YYYY')
        //     });
        //   }
        // }
        console.log("Finished reding.");
      }
    }
    return browserHistory;
  })();
}

function getFirefoxHistory(historyTimeLength = 5) {
  return (function (historyTimeLength) {
    browsers.browserDbLocations.firefox = browsers.findPaths(
      browsers.defaultPaths.firefox,
      browsers.FIREFOX
    );
    let getPaths = browsers.findPaths(
      browsers.defaultPaths.firefox,
      browsers.FIREFOX
    );
    console.log("historyTimeLength: " + historyTimeLength);
    console.log("firefox");
    console.log(getPaths);
    let records = getBrowserHistory(
      browsers.browserDbLocations.firefox,
      browsers.FIREFOX,
      historyTimeLength
    );
    return records;
  })(historyTimeLength);
}

function getSeaMonkeyHistory(historyTimeLength = 5) {
  return new Promise((resolve, reject) => {
    let getPaths = [
      browsers
      .findPaths(browsers.defaultPaths.seamonkey, browsers.SEAMONKEY)
      .then(foundPaths => {
        browsers.browserDbLocations.seamonkey = foundPaths;
      })
    ];
    Promise.all(getPaths).then(
      () => {
        let getRecords = [
          getBrowserHistory(
            browsers.browserDbLocations.seamonkey,
            browsers.SEAMONKEY,
            historyTimeLength
          )
        ];
        Promise.all(getRecords).then(
          records => {
            resolve(records);
          },
          error => {
            reject(error);
          }
        );
      },
      error => {
        reject(error);
      }
    );
  });
}

function getChromeHistory(historyTimeLength) {
  return (function (historyTimeLength) {
    console.log("Start finding path");
    // browsers.browserDbLocations.chrome = browsers.findPaths(
    //   browsers.defaultPaths.chrome,
    //   browsers.CHROME
    // );
    console.log("End finding path");
    let getRecords = getBrowserHistory(
      browsers.browserDbLocations.chrome,
      browsers.CHROME,
      historyTimeLength
    );
    return getRecords;
    //  console.log("Records");
    //  console.log(getRecords);
  })(historyTimeLength);
}

function getOperaHistory(historyTimeLength = 5) {
  return (function (historyTimeLength) {
    browsers.browserDbLocations.opera = browsers.findPaths(
      browsers.defaultPaths.opera,
      browsers.OPERA
    );
    let getPaths = browsers.findPaths(
      browsers.defaultPaths.opera,
      browsers.OPERA
    );
    console.log("historyTimeLength: " + historyTimeLength);
    console.log("Chrome");
    console.log(getPaths);
    let getRecords = getBrowserHistory(
      browsers.browserDbLocations.opera,
      browsers.OPERA,
      historyTimeLength
    );
    console.log("Records");
    console.log(getRecords);
  })(historyTimeLength);
}

function getTorchHistory(historyTimeLength = 5) {
  return (function (historyTimeLength) {
    browsers.browserDbLocations.torch = browsers.findPaths(
      browsers.defaultPaths.torch,
      browsers.TORCH
    );
    let getPaths = browsers.findPaths(
      browsers.defaultPaths.torch,
      browsers.TORCH
    );
    console.log("historyTimeLength: " + historyTimeLength);
    console.log("Chrome");
    console.log(getPaths);
    let getRecords = getBrowserHistory(
      browsers.browserDbLocations.torch,
      browsers.TORCH,
      historyTimeLength
    );
    console.log("Records");
    console.log(getRecords);
  })(historyTimeLength);
}

function getSafariHistory(historyTimeLength = 5) {
  return (function (historyTimeLength) {
    browsers.browserDbLocations.safari = browsers.findPaths(
      browsers.defaultPaths.safari,
      browsers.SAFARI
    );
    let getPaths = browsers.findPaths(
      browsers.defaultPaths.safari,
      browsers.SAFARI
    );
    console.log("historyTimeLength: " + historyTimeLength);
    console.log("Safari");
    console.log(getPaths);
    let getRecords = getBrowserHistory(
      browsers.browserDbLocations.safari,
      browsers.SAFARI,
      historyTimeLength
    );
    console.log("Records");
    console.log(getRecords);
  })(historyTimeLength);
}

function getMaxthonHistory() {
  return (function (historyTimeLength) {
    browsers.browserDbLocations.maxthon = browsers.findPaths(
      browsers.defaultPaths.maxthon,
      browsers.MAXTHON
    );
    let getPaths = browsers.findPaths(
      browsers.defaultPaths.maxthon,
      browsers.MAXTHON
    );
    console.log("historyTimeLength: " + historyTimeLength);
    console.log("MAXTHON");
    console.log(getPaths);
    let getRecords = getBrowserHistory(
      browsers.browserDbLocations.maxthon,
      browsers.MAXTHON,
      historyTimeLength
    );
    console.log("Records");
    console.log(getRecords);
  })(historyTimeLength);
}

function getVivaldiHistory(historyTimeLength = 5) {
  return (function (historyTimeLength) {
    browsers.browserDbLocations.vivaldi = browsers.findPaths(
      browsers.defaultPaths.vivaldi,
      browsers.VIVALDI
    );
    let getPaths = browsers.findPaths(
      browsers.defaultPaths.vivaldi,
      browsers.VIVALDI
    );
    console.log("historyTimeLength: " + historyTimeLength);
    console.log("Chrome");
    console.log(getPaths);
    let getRecords = getBrowserHistory(
      browsers.browserDbLocations.vivaldi,
      browsers.VIVALDI,
      historyTimeLength
    );
    console.log("Records");
    console.log(getRecords);
  })(historyTimeLength);
}

module.exports = {
  getFirefoxHistory,
  getSeaMonkeyHistory,
  getChromeHistory,
  getOperaHistory,
  getTorchHistory,
  getSafariHistory,
  getMaxthonHistory,
  getVivaldiHistory
};