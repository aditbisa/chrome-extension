/**
 * Extension installed.
 */
chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create({
    id: 'mbExecute',
    contexts: ['image'],
    title: "Extract MangaBat"
  });
});

/**
 * ContectMenu clicked.
 */
chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (!info.pageUrl.includes('mangabat.com')) return;
  if (info.menuItemId == 'mbExecute') mbExecute();
});



async function mbExecute() {
  const tab = await getActiveTab();
  await allowCors(tab.id);
  await chrome.tabs.reload(tab.id);
  await waitFor(async () => {
    let t = await chrome.tabs.get(tab.id);
    return t.status == "complete";
  });
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: mbScript,
    args: [],
  });
}

async function mbScript() {
  console.log('collecting..');
  //if (!document.location.hostname.endsWith('read.mangabat.com')) return;

  const CRLF = '\r\n';

  const $q = (s) => document.querySelector(s)
    , $$q = (s) => Array.from(document.querySelectorAll(s));

  const safeFilename = s => s.replace(/[^\w \~\!\@\#\$\%\^\&\(\)\-\+\=\`\'\,\.\[\]\{\}]/g, '').replace(/\.$/, '')
    , padChapter = s => {
      let n = Number(s);
      if (Number.isNaN(n)) return s;
      if (Number.isInteger(n)) return s.padStart(3, '0');
      let i = (Math.floor(n) + '').padStart(p, '0');
      let d = (n + '').replace(/^\d+/, '');
      return i + d;
    };

  const m = /(.*) Chapter ([^ ]*) /.exec(document.title)
    , manga = safeFilename(m[1])
    , chapter = padChapter(safeFilename(m[2]));

  const images = $$q('.img-content');

  function toBase64Uri(img) {
    let canvas = document.createElement("canvas");
    canvas.height = img.naturalHeight;
    canvas.width = img.naturalWidth;
    canvas.getContext("2d").drawImage(img, 0, 0);
    return canvas.toDataURL();
  }
  images.forEach(img => img.crossOrigin = "anonymous");

  const qSize = 3
    , queue = [];  // Sliced items

  function buildDataUri() {
    images
      .map((img, idx) => {
        let url = toBase64Uri(img)
          , num = ((idx + 1) + '').padStart(2, '0')
          , ext = /\.[^\.]*$/.exec(img.src)[0]
          , filename = 'manga/' + manga + '/' + chapter + '/' + num + ext;
        return { url, filename };
      })
      .forEach((val, idx, arr) => {
        if (idx % qSize != 0) return;
        a = [];
        for (i = 0; i < qSize; i++) {
          if (arr[idx + i]) a.push(arr[idx + i]);
        }
        queue.push(a);
      });

    downloadQueue();
  }
  async function downloadQueue() {
    for (const items of queue) {
      chrome.runtime.sendMessage(chrome.runtime.id, {
        action: 'downloads',
        data: items
      });
      await new Promise((resolve) => {
        setTimeout(resolve, 250);
      });
    }
  }
  setTimeout(buildDataUri, 500);

  // let text = images
  //     .map(img => img.src)
  //     .join(CRLF);
  // navigator.clipboard.writeText(text);
}
