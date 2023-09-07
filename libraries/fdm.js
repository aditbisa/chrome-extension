// Free Download Manager
// Computer\HKEY_CURRENT_USER\SOFTWARE\Google\Chrome\NativeMessagingHosts\org.freedownloadmanager.fdm5.cnh
// C:\Users\aditb\AppData\Local\Softdeluxe\Free Download Manager\org.freedownloadmanager.fdm5.cnh.json


function fdmConnect() {
    const appName = 'org.freedownloadmanager.fdm5.cnh';
    const msg = {
        id: '0',
        type: 'handshake',
        api_version: '1',
        browser: 'Chrome'
    };
    chrome.runtime.sendNativeMessage(appName, msg, (m) => console.log(m));
}

function fdmDownload() {
    const appName = 'org.freedownloadmanager.fdm5.cnh';
    const url = 'https://static.wikia.nocookie.net/azumanga/images/e/e3/Yotsuba01.jpg';
    const msg = {
        id: '0',
        type: 'create_downloads',
        create_downloads: {
            downloads: [
                {   url,
                    originalUrl: url,
                    httpReferer: '',
                    postData: '',
                    documentUrl: ''
                }
            ]
        }
    };
    chrome.runtime.sendNativeMessage(appName, msg, (m) => console.log(m));
}
