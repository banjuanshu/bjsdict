(function () {
    if (localStorage.skin === undefined) {
        chrome.tabs.create({url: '../pages/options.html'});
    }



    localStorage.skin || (localStorage.skin = 'orange');
    localStorage.mainDict || (localStorage.mainDict = 'bing');
    localStorage.translate || (localStorage.translate = 'baidu');
    localStorage.capture || (localStorage.capture = JSON.stringify([{status: false, assistKey: 'type', hotKey: ''}, {status: true, assistKey: 'shiftKey', hotKey: ''}, {status: true, assistKey: 'shiftKey', hotKey: ''}]));

    var portPool = {};

    function setPageActionIcon() {
        var ico, hoverCapture = localStorage.hoverCapture, dragCapture = localStorage.dragCapture;
        if (hoverCapture === '1' && dragCapture === '1') {
            ico = '../assets/normal.png';
        }
        else if (hoverCapture === '1') {
            ico = '../assets/hover.png';
        }
        else if (dragCapture === '1') {
            ico = '../assets/drag.png';
        }
        else {
            ico = '../assets/off.png';
        }

        chrome.browserAction.setIcon({path: ico});
    }


    chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
        if (request.cmd === 'config') {
            sendResponse({
                skin: localStorage.skin,
                capture: JSON.parse(localStorage.capture)
            });
        }
    });

    chrome.extension.onConnect.addListener(function(port) {
        if (port.name === 'dict') {
            if (port.tab) {
                portPool[port.portId_] = port;
                port.onMessage.addListener(function (msg, port) {
                    simpleQuery(msg.w, port, msg.dict, msg.type);
                });
                port.onDisconnect.addListener(function () {
                    delete portPool[port.portId_];
                });
            }
            else {
                port.onMessage.addListener(function (msg, port) {
                    if (msg.cmd === 'query') {
                        simpleQuery(msg.w, port, msg.dict, msg.type);
                    }
                    else {
                        for (var key in portPool) {
                            portPool[key].postMessage({cmd: 'setCaptureMode', capture: msg.capture});
                        }
                    }
                });
            }
        }
    });

    function simpleQuery(key, port, dict, type) {
        var q = new Query();
        if (dict === undefined) {
            dict = /^[a-z]+([-'][a-z]+)*$/i.test(key) ? localStorage.mainDict : localStorage.translate;
        }
        q.query({
            word: key,
            api: dict,
            callback: function (result) {
                port.postMessage(result);
            }
        });
    }	
})(this, this.document);
