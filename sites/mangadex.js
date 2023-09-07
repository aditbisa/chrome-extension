/**
 * Extension installed.
 */
chrome.runtime.onInstalled.addListener(function() {
    chrome.contextMenus.create({
        id: 'mdExecute',
        contexts: ['image'],
        title: "Extract MangaDex"
    });
    chrome.contextMenus.create({
        id: 'mdExecuteContinues',
        contexts: ['image'],
        title: "Extract MangaDex (Continues)"
    });
});

/**
 * ContectMenu clicked.
 */
chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (!info.pageUrl.includes('mangadex.org')) return;
    if (info.menuItemId == 'mdExecute') mdExecute(false);
    if (info.menuItemId == 'mdExecuteContinues') mdExecute(true);
});



async function mdExecute(continues) {
    const tab = await getActiveTab();
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: mdScript,
        args: [continues],
    });
}

async function mdScript(continues) {
    window.downloadContinues = !!continues ? 25 : 0;
    
    window.CRLF = '\r\n';
    window.$q = (s, c) => (c || document).querySelector(s);
    window.$$q = (s, c) => Array.from((c || document).querySelectorAll(s));
    window.safeFilename = s => s.replace(/[^\w \~\!\@\#\$\%\^\&\(\)\-\+\=\`\'\,\.\[\]\{\}]/g, '').replace(/\.$/, '');
    window.getFileExtension = (s) => /\.[^\.]*$/.exec(s)[0];
    window.padNumber = (s, p) => {
      p = p || 3;
      let n = Number(s);
      if (Number.isNaN(n)) return s;
      if (Number.isInteger(n)) return (s+'').padStart(p, '0');
      let i = (Math.floor(n)+'').padStart(p, '0');
      let d = (n+'').replace(/^\d+/, '');
      return i + d;
    };
    window.waitForSeconds = async (s) => new Promise((r) => setTimeout(r, s * 1000));
    
    window.downloadChapter = async () => {
        const sideMenu = $q('.reader--menu.open');
        if (!sideMenu) {
            message = 'Side menu not found. Goto reading chapter page to download.';
            console.log(message);
            alert(message);
            return;
        }
        
        const infoElm = document.createElement('div');
        infoElm.classList.add('personal-download-info');
        infoElm.style.background = 'royalblue';
        infoElm.style.color = 'white';
        infoElm.style.textAlign = 'center';
        infoElm.style.padding = '8px';
        $q('hr', sideMenu).after(infoElm); // After first HR
        
        infoElm.textContent = `Waiting for images..`;
        while (true) {
            let buttons = $$q('button.error');
            if (buttons.length) {
                buttons.forEach(b => b.click());
                await waitForSeconds(3);
            }
            
            let spinners = $$q('svg.spinner');
            if (spinners.length <= 1) break; // There's one hidden.
            
            console.log('Waiting for images..');
            await waitForSeconds(5);
        }
        
        infoElm.textContent = `Collecting..`;
        console.log('Collecting..');
        
        const mangaNameElm = $q('a[title]', sideMenu)
            , chapterElm = $q('#chapter-selector > div span', sideMenu[3]);

        let   manga = mangaNameElm.textContent.trim()
            , mangaFolder = safeFilename(manga)
            , chapter = chapterElm.textContent.trim();
        console.log(manga);
        console.log(chapter);
        
        if (chapter.startsWith('Ch.')) {
            chapter = padNumber(chapter.replace(/^Ch.\s*/, ''), 3);
        } else {
            let a = /Vol\. (\d+)\ Ch\. (.*)/.exec(chapter);
            if (!a) {
                // As is
            }
            else if (Number(a[1]) >= 2 && Number(a[2]) >= 9) {
                chapter = padNumber(a[2], 3);
            }
        }
        let chapterFolder = safeFilename(chapter);
        
        let downloadPath = `manga/${mangaFolder}/`;
        downloadPath += chapterFolder ? `${chapterFolder}/` : '';
        
        const images = $$q('img[src^="blob:"]')
            .map((img, index) => {
                number = padNumber(index + 1, 2);
                return {
                    url: img.src,
                    filename: `${downloadPath}${number}.jpg` // Chrome will auto correct extension
                };
            });
        console.log(images);
        
        const image_count = images.length
            , expected_count = $q('.reader--meta.page').textContent.split('/')[1] * 1;
        if (image_count != expected_count) {
            message = `Images still loading. Expect ${expected_count} but found ${image_count}`;
            console.log(message);
            alert(message);
        }
        
        chrome.runtime.sendMessage(chrome.runtime.id, {
            action: 'downloads',
            data: images
        });
        
        infoElm.textContent = `${chapter}: ${image_count} Downloading..`;
        console.log(`${chapter}: ${images.length} images collected.`);
    };
    
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.downloaded === true) {
            const lastInfo = document.querySelector('.personal-download-info');
            lastInfo.textContent = lastInfo.textContent.replace(/Downloading.*/, 'Downloaded!');
            console.log('Download finish.');
            
            if (downloadContinues > 0) {
                downloadContinues--;
                $q('#chapter-selector > a[href^="/chapter"]:last-child').click();
                setTimeout(downloadChapter, 2000);
            }
        }
        return true;
    });
    
    downloadChapter();
}
