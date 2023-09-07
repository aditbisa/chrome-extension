/**
 * Extension installed.
 */
 chrome.runtime.onInstalled.addListener(function() {
    chrome.contextMenus.create({
        id: 'fandomExecute',
        contexts: ['all'],
        title: "Extract Fandom"
    });
});

/**
 * ContectMenu clicked.
 */
chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (!info.pageUrl.includes('fandom.com')) return;
    if (info.menuItemId == 'fandomExecute') mdExecute();
});



async function fandomExecute() {
    const tab = await getActiveTab();
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: fandomScript
    });
}

async function fandomScript() {
    console.log('Collecting..');
    
    const CRLF = '\r\n'
        , $q = (s, c) => (c || document).querySelector(s)
        , $$q = (s, c) => Array.from((c || document).querySelectorAll(s));
    
    elm = $0;
    images = new Map(); // {normalize-key => url}
    wikis = {}; // {wiki-path => [block-html]}
    
    const collectImage = (e) => {
        let src = (e.hasAttribute('data-src'))
            ? e.getAttribute('data-src')
            : e.src;
        src = src.replace(/\/revision.*$/,'');
        
        let key = src.split('/').pop();
        key = decodeURI(key);
        
        images.set(key, src);
        
        local = `/images/${key}`;
        return {key, src, local};
    }
    
    const cleanup = (elm) => {
        // With item frame -> aside.portable-infobox.pi-theme-item img.pi-image-thumbnail
        elm.querySelectorAll('img').forEach(e => {
            let {local} = collectImage(e);
            e.setAttribute('data-src', local);
            e.removeAttribute('src');
            e.removeAttribute('srcset');
            e.removeAttribute('class');
            e.removeAttribute('decoding');
            e.removeAttribute('data-image-name');
            e.removeAttribute('data-image-key');
        });
        elm.querySelectorAll('a.image').forEach(e => {
            e.parentElement.append(e.firstElementChild);
            e.remove();
        });
    }
    
    $$q('img', elm).forEach(collectImage);
    
    links = $$q('a[href]', elm)
        .map(e => e.href)
        .filter(s => s.includes('/wiki/'))
        .filter((v,i,a) => a.indexOf(v)===i);
    
    for (i=0; i<links.length; i++) {
        await fetch(links[i]).then(r => r.text()).then(t => {
            const doc = (new DOMParser()).parseFromString(t,'text/html');
            let sides = doc.querySelectorAll('aside[role="region"]');
            if (!sides.length) return;
            
            let wikiPath = links[i].replace(/^.*wiki/,'/wiki');
            let tmpBlock = doc.createElement('div');
            
            sides.forEach(side => {
                cleanup(side);
                tmpBlock.append(side);
            });
            
            wikis[wikiPath] = tmpBlock.innerHTML;
            console.log(Object.keys(wikis).length, links[i]);
        });
    }
    
    html = Object.keys(wikis).map(path => `<div data-block="${path}">${wikis[path]}</div>`).join('\n');
}
