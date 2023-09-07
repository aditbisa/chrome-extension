/**
 * Message listener.
 */
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

  if (request.action == 'downloads') {
    downloadRegister(request.data, sender.tab?.id);
  }

  if (request.action == 'check-downloads') {
    downloadDump(sendResponse);
  }

  return true;
});

/**
 * Download changed.
 */
chrome.downloads.onChanged.addListener(function (downloadDelta) {
  if (!downloadDelta.state) return;
  downloadStateChanged(downloadDelta.id, downloadDelta.state.current, downloadDelta);
});



async function downloadRegister(data, tabId) {
  console.log('Download', data);
  let downloads = await getStorage('downloads', []);
  const noProcess = !downloads.some(item => !!item.id && !item.finished);
  if (noProcess) downloads = [];
  downloads.push(...data.map(d => downloadItem(d.url, d.filename, tabId)));
  await setStorage({ downloads });
  if (noProcess) setTimeout(downloadNext, 50);
}

function downloadItem(url, filename, tabId) {
  return {
    url,
    filename,
    id: null,         // null: queue
    finished: false,  // false: in_progress, true: interrupted | complete.
    erased: false,
    error: '',
    tabId
  };
}

async function downloadNext() {
  const downloads = await getStorage('downloads');
  const item = downloads.find(item => !item.id);

  if (!item) return; // Done

  try {
    item.id = await downloadAdd(item);
  }
  catch (err) {
    item.id = -1;
    item.error = err;
    console.error(item.url, err.message);
  }
  await setStorage({ downloads });
}

async function downloadAdd(item) {
  return new Promise((resolve, reject) => {
    chrome.downloads.download({
      url: item.url,
      filename: item.filename,
      conflictAction: 'overwrite'
    }, downloadId => {
      if (downloadId) {
        resolve(downloadId);
      } else {
        reject(chrome.runtime.lastError);
      }
    });
  });
}

async function downloadStateChanged(id, state, delta) {
  const downloads = await getStorage('downloads');
  const item = downloads.find(i => i.id == id);
  if (!item) return; // Not in our managed item.

  if (!['interrupted', 'complete'].includes(state)) return;

  item.finished = true;
  if (delta.error) {
    item.error = delta.error.current;
  }
  if (state == 'complete') {
    item.erased = true;
    chrome.downloads.erase({ id });

    if (item.tabId) {
      const notYet = downloads.find(i => i.tabId == item.tabId && !i.finished);
      if (!notYet) {
        chrome.tabs.sendMessage(item.tabId, { downloaded: true });
      }
    }
  }

  await setStorage({ downloads });
  downloadNext();
}



function downloadDump(sendResponse) {
  chrome.downloads.search({}, items => {
    console.log(items);
    sendResponse && sendResponse(items);
  });
}
