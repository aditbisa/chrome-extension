/**
 * Extension installed.
 */
 chrome.runtime.onInstalled.addListener(function() {
    testAddMenu();
});

/**
 * ContectMenu clicked.
 */
chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId == 'testExecute') testExecute();
});



function testAddMenu() {
    chrome.contextMenus.create({
        id: 'testExecute',
        contexts: ['all'],
        title: "Test Function"
    });
}

async function testExecute() {
    const tab = await getActiveTab();
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: testScript,
        args: [],
    });
}

async function testScript() {
    console.log("👍", 1);

    const images = [
        {
            "url": "blob:https://mangadex.org/c40b677e-a81f-452a-a2a6-d5b91fc80e3b",
            // "filename": "manga/Watashitte Eroin desu./Vol. 1 Ch. 1/01.jpg"
            "filename": "manga/Watashitte Eroin desu./01.jpg"
        }
    ];
    chrome.runtime.sendMessage(chrome.runtime.id, {
        action: 'downloads',
        data: images
    });

    console.log("💨");
}
