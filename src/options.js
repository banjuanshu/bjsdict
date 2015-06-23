;(function (window, document, undefined) {
    var mainview = document.getElementById('mainview');

    uiEnhance();
    restoreOptions();

    function uiEnhance() {
        var elements, elem, i, len;
        //navtab
       	elements = document.getElementById('navbar-container').querySelectorAll('li');
        for (i = 0, len = elements.length ; i < len ; i += 1) {
            elements[i].addEventListener('click', navTab, false);
        }

        delegate(document.getElementById('skinSection'), 'input', 'click', save);
        delegate(document.getElementById('dictSection'), 'select', 'change', save);

        var captureSection = document.getElementById('captureSection');
        delegate(captureSection, 'select', 'change', saveCapture);
		delegate(captureSection, 'input', 'click', saveCapture);
    }

    function navTab() {
        if (navTab.last !== this.id) {
            document.getElementById(this.id.slice(0, -3)).style.display = '';
            this.className = 'selected';
            document.getElementById(navTab.last.slice(0, -3)).style.display = 'none';
            document.getElementById(navTab.last).className = '';
            navTab.last = this.id;
        }
    }
    navTab.last = 'browserPageNav';

    // Saves options to localStorage.
    function save(e) {
        var node = e.target;
        if (node.nodeName === 'INPUT' && node.checked) {
            localStorage[node.name] = node.value;
        }
        else if (node.nodeName === 'SELECT') {
            localStorage[node.name] = node.value;
        }
    }

    function saveCapture(e) {
        var node = e.target,
            setting = JSON.parse(localStorage.capture),
            tr = Array.prototype.slice.call(document.querySelectorAll('#captureSection tbody tr'), 0);
            
        if (node.nodeName === 'INPUT') {
            setting[tr.indexOf(node.parentNode.parentNode)].status = node.checked;
        }
        else if (node.nodeName === 'SELECT') {
            setting[tr.indexOf(node.parentNode.parentNode)].assistKey = node.value;
        }
        
        localStorage.capture = JSON.stringify(setting);
    }

    function setHotKey(e) {
        var keyCode = e.keyCode, key, hotKeys = {}, i, value = '';

        if (keyCode === 8) {
            value = '';
            hotKeys = {};
        }

        if (64 < keyCode && keyCode < 91 || 111 < keyCode && keyCode < 124 || 47 < keyCode && keyCode < 58) {
            hotKeys.ctrlKey 	= e.ctrlKey;
            hotKeys.altKey 		= e.altKey;
            hotKeys.shiftKey 	= e.shiftKey;
            hotKeys.metaKey 	= e.metaKey;

            for (i in hotKeys) {
                if (hotKeys[i]) {
                    switch (i) {
                    case 'ctrlKey':
                        key = 'CTRL';
                        break;
                    case 'altKey':
                        key = 'ALT';
                        break;
                    case 'shiftKey':
                        key = 'SHIFT';
                        break;
                    case 'metaKey':
                        key = 'META';
                        break;
                    }
                    value += '+' + key;
                }
            }

            if (111 < keyCode && keyCode < 124) {
                key = 'F' + (keyCode - 111);
            }
            else {
                key = String.fromCharCode(keyCode);
            }
            value += '+' + key;
            value = value.substring(1);
            this.value = value;
            hotKeys.keyCode = keyCode;
            localStorage[this.name] = JSON.stringify(hotKeys);
        }
    }

    // Restores select box state to saved value from localStorage.
    function restoreOptions() {
        var i, len, elements, elem, setting, set;

        elements = mainview.querySelectorAll('#skinSection input');
        for (i = 0, len = elements.length ; i < len ; i += 1) {
            elem = elements[i];
            if (elem.value === localStorage[elem.name]) {
                elem.checked = true;
            }
            else {
                elem.checked = false;
            }
        }

        elements = mainview.querySelectorAll('#dictSection select');
        for (i = 0, len = elements.length ; i < len ; i += 1) {
            elem = elements[i];
            elem.querySelector('option[value=' + localStorage[elem.name] + ']').selected = true;
        }


        elements = mainview.querySelectorAll('#captureSection tbody tr');
        setting = JSON.parse(localStorage.capture);
        for (i = 0, len = elements.length ; i < len ; i += 1) {
            elem = elements[i];
            set = setting[i];
            elem.querySelector('input').checked = set.status;
            elem.querySelector('select').value = set.assistKey;
        }
    }

    function delegate(node, selector, type, handler) {
        node.delegate || (node.delegate = {});
        node.delegate[selector] = {handler: handler};
        delegate.nodeList || (delegate.nodeList = []);
        
        if (delegate.nodeList.indexOf(node) === -1) {
            node.addEventListener(type, function (e) {
                var target = e.target, key, tmp;
                do {
                    for (key in node.delegate) {
                        tmp = node.delegate[key];
                        if (Array.prototype.indexOf.call(node.querySelectorAll(key), target) > -1) {
                            delete e.target;
                            e.target = target;
                            tmp.handler.call(target, e);
                            return;
                        }
                    }
                    target = target.parentNode;
                }
                while (target && target !== this);
            }, false);
            delegate.nodeList.push(node);
        }
    }

})(this, this.document);
