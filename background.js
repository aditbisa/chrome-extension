/**
 * By Aditya Ghaffar <adit.bisa@gmail.com>
 */
try {
  const files = [];
  files.push('/test.js');
  files.push('/libraries/cors.js');
  files.push('/libraries/download.js');
  //files.push('/libraries/fdm.js');
  files.push('/sites/mangadex.js');
  files.push('/sites/mangabat.js');
  files.push('/sites/fandom.js');
  importScripts(...files);
} catch (e) {
  console.error(e);
}



/**
 * Extension installed.
 */
chrome.runtime.onInstalled.addListener(function () {
  setStorage({ downloads: [] });
});



/**
 * Promise to wait for condition callback with timeout.
 * The condition callback support return Promise.
 */
 async function waitFor(condition, timeout) {
  return new Promise((resolve, reject) => {
    const time = 250;
    timeout = Number.isNaN(+timeout) ? 60000 : timeout;
    
    const wait = async () => {
      timeout -= time;
      
      let result = condition();
      if (result instanceof Promise) {
        result = await result;
      }
      
      if (result) {
        resolve(result);
      } else {
        if (timeout <= 0) reject();
        setTimeout(wait, time);
      }
    };
    
    setTimeout(wait, time);
  });
}


/**
 * Helpers: ActiveTab.
 */
async function getActiveTab() {
  let options = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(options);
  return tab;
}


/**
 * Helpers: Storage get/set.
 */
async function setStorage(data) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(data, () => resolve());
  });
}
async function getStorage(keys, defaultByString) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (items) => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      if (typeof keys == 'string') {
        resolve(items[keys] || defaultByString);
      }
      else {
        resolve(items);
      }
    });
  });
}
