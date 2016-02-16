(function (window, document, undefined) {

    function extend(childCtor, parentCtor) {
        function tempCtor() {};
        tempCtor.prototype = parentCtor.prototype;
        childCtor.prototype = new tempCtor();
        childCtor.prototype.super = parentCtor.prototype;
        childCtor.prototype.constructor = childCtor;
    }

    function proxy(fn, obj) {
        return function () {
            return fn.apply(obj, arguments);
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


    function Dict (args) {
        this.skin = args.skin;
        this.capture = args.capture;
        this.ui = null;
        this.port = chrome.extension.connect({name: 'dict'});

        this.rHasWord = /\b[a-z]+([-'][a-z]+)*\b/i;
        this.rAllWord = /\b[a-z]+([-'][a-z]+)*\b/gmi;
        this.rSingleWord = /^[a-z]+([-'][a-z]+)*$/i;

        this.port.onMessage.addListener(proxy(function (msg) {
            if (msg.cmd) {
                if (this.ui) {
                    document.body.removeChild(this.ui);
                    this.ui = null;
                }
                this.capture = msg.capture;
            }
            else {
                this.show(msg);
            }
        }, this));

        this.assistKeyDefer = false;

        document.body.addEventListener('mouseover', proxy(this.hoverTrigger, this), false);
        //document.body.addEventListener('click', proxy(this.dblclick, this), false);
        document.body.addEventListener('mousedown', proxy(this.dragStart, this), false);
        document.body.addEventListener('mouseup', proxy(this.dragEnd, this), false);
        document.body.addEventListener('keyup', proxy(this.keyPress, this), false);
    };

    Dict.prototype.setCapture = function () {
        if (this.capture[0].status) {
            document.body.removeEventListener('click', this.dblclickProxy, false);
            document.body.removeEventListener('mousedown', this.dragStartProxy, false);
            this.dblclickProxy = null;
            this.dragStartProxy = null;
            this.ui.style.display = 'none';
            this.dragCapture = false;
        }
        else {
            document.body.addEventListener('click', this.dblclickProxy = proxy(this.dblclick, this), false);
            document.body.addEventListener('mousedown', this.dragStartProxy = proxy(this.dragStart, this), false);
            this.dragCapture = true;
        }

        if (this.h.status) {
            document.body.addEventListener('mouseover', this.hoverProxy = proxy(this.hoverTrigger, this), false);
        }
        else {
            document.body.removeEventListener('mouseover', this.hoverProxy, false);
            this.hoverProxy = null;
            this.getMousePosProxy = null;
            this.ui.style.display = 'none';
        }
    };

    Dict.prototype.dblclick = function (e) {
        var capture = this.capture[1];
        if (capture.status) {
            if (this.ui) {
                document.body.removeChild(this.ui);
                this.ui = null;
            }
            if (e.detail > 1) {
                if (e[capture.assistKey]) {this.captureText(e);}
                else {this.assistKeyDefer = capture.assistKey;}
            }
        }
    };

    Dict.prototype.dragStart = function (e) {
        if (this.capture[2].status || this.capture[1].status) {
            this.startPos = e.pageX;
            if (this.ui) {
                document.body.removeChild(this.ui);
                this.ui = null;
            }
        }
    };

    Dict.prototype.dragEnd = function (e) {
        var capture;
        if (e.detail === 1) {
            capture = this.capture[2];
            if (capture.status && this.startPos !== e.pageX) {
                if (e[capture.assistKey]) {this.captureText(e);}
                else {this.assistKeyDefer = capture.assistKey;}
            }
        }
        else if (e.detail > 1) {
            capture = this.capture[1];
            if (capture.status) {
                if (e[capture.assistKey]) {this.captureText(e);}
                else {this.assistKeyDefer = capture.assistKey;}
            }
        }
        this.startPos = undefined;
    };

    Dict.prototype.keyPress = function (e) {
        if (e.keyCode === {ctrlKey: 17, altKey: 18, shiftKey: 16}[this.assistKeyDefer]) {
            this.captureText(e);
        }
    };

    Dict.prototype.hoverTrigger = function (e) {
        var capture = this.capture[0];

        if (!capture.status || capture.status && !e[capture.assistKey]) {return;}

        if (e.target.nodeName.toLowerCase() === 'textarea') {return;}

        if (this.timer === null) {
            this.hoverHanlder(e);
            return;
        }

        this.hoverX = e.pageX;
        this.hoverY = e.pageY;
        //clearTimeout(this.timer);
        this.timer = setTimeout(proxy(function () {
            if (this.startPos === undefined && this.hoverX === e.pageX && this.hoverY === e.pageY) {
                this.hoverHanlder(e);
            }
        }, this), 1000);
        e.stopPropagation();
    };

    Dict.prototype.hoverHanlder = function (e) {
        if (this.ui) {
            document.body.removeChild(this.ui);
            this.ui = null;
        }
        this.text = null;
        this.timer = undefined;
        var parent = e.target, elems, wraper, i, len, elem, next;
        elems = parent.childNodes;
        if (elems.length === 1) {
            elem = elems[0];
            if (elem.nodeType === 3) {
                var text = elem.nodeValue;
                if (this.rSingleWord.test(text) && parent.resolve) {
                    this.text = elem.nodeValue;
                    this.handle(e);
                    this.node = parent;
                }
                else if (this.rHasWord.test(text)) {
                    text = text.replace(this.rAllWord, function (str) {
                        return '<z>' + str + '</z>';
                    });
                    this.timer = null;
                    parent.innerHTML = text;
                    elems = parent.getElementsByTagName('z');
                    for (i = 0, len = elems.length ; i < len ; i += 1) {
                        elems[i].resolve = true;
                    }
                }
            }
        }
        else if (!parent.resolve) {
            elems = Array.prototype.slice.call(elems, 0);
            this.timer = null;
            for (i = 0, len = elems.length ; i < len ; i += 1) {
                elem = elems[i];
                if (elem.nodeType === 3 && this.rHasWord.test(elem.nodeValue)) {
                    wraper = document.createElement('z');
                    parent.insertBefore(wraper, elem);
                    wraper.appendChild(elem);
                }
            }
        }
        parent.resolve = true;
    };

    Dict.prototype.captureText = function (e) {
        this.node = null;
        this.assistKeyDefer = null;
        this.text = window.getSelection().toString().trim();
        this.handle(e);
    };

    Dict.prototype.handle = function (e, type) {
        var data = {};
        if (this.text.length > 0) {
            data['cmd'] = 'query';
            data['w'] = this.text;
            this.port.postMessage(data);
        }
    };





    function DictSimple(args) {
        this.super.constructor.call(this, args);
    }

    extend(DictSimple, Dict);

    DictSimple.prototype.drawAlert = function (w, h) {
        var canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
        canvas.width = w;
        canvas.height = h;
        ctx.beginPath();
        ctx.fillStyle = '#000';

        ctx.moveTo(26, 71);
        ctx.lineTo(84, 71);
        ctx.lineTo(177, 0);
        ctx.lineTo(177, 300);
        ctx.lineTo(84, 229);
        ctx.lineTo(26, 229);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = '#000';

        ctx.moveTo(222, 76);
        ctx.lineTo(236, 63);
        ctx.bezierCurveTo(272, 93, 296, 186, 234, 247);
        ctx.lineTo(220, 234);
        ctx.bezierCurveTo(253, 202, 270, 131, 222, 76);
        ctx.closePath();
        ctx.fill();
        return canvas;
    };

    DictSimple.prototype.eventClear = function (e) {
        e.stopPropagation();
    };

    DictSimple.prototype.show = function (data) {
        var i, len, str = '', self = this;
        if (data.key === this.text) {
            if (!this.node && window.getSelection().toString().trim() !== this.text) {
                this.text = '';
                return;
            }
            if (this.ui) {
                document.body.removeChild(this.ui);
                this.ui = null;
            }
            this.ui = document.createElement('aside');
            this.ui.id = 'dict-viclm-simple';
            this.ui.className = this.skin;
            str += '<header>';
            if (data.type === 'dict') {
                str += '<h1>' + data.key + '</h1>';
            }
            if (data.ps) {
                str += '<span>[ ' + data.ps + ' ]</span>';
            }
            if (data.pron) {
                str += '<img src="' + this.drawAlert(300, 300).toDataURL() + '"><audio src="' + data.pron + '"></audio>';
            }
            str += '</header>';
            for (i = 0, len = data.tt.length ; i < len ; i += 1) {
                str += '<p><span>' + data.tt[i].pos + '</span> ' + data.tt[i].acceptation + '</p>';
            }
            str += '<footer>';
            for (i = 0, len = data.dicts.length ; i < len ; i += 1) {
                str += '<a href="" data-api="' + data.dicts[i] + '" style="background:url('+chrome.extension.getURL('assets/'+data.dicts[i]+'.png')+')"></a>';
            }
            str += '</footer>';
            str += '<div class="down"></div>';

            this.ui.innerHTML = str;
            document.body.appendChild(this.ui);
            this.ui.addEventListener('mouseover', this.eventClear, false);
            this.ui.addEventListener('mousedown', this.eventClear, false);
            this.ui.addEventListener('mouseup', this.eventClear, false);
            this.ui.addEventListener('keyup', this.eventClear, false);
            delegate(this.ui, 'img', 'click', function () {
                this.nextSibling.play();
            });
            delegate(this.ui, 'footer a', 'click', function (e) {
                self.port.postMessage({cmd: 'query', w: data.key, dict: e.target.dataset.api});
                e.preventDefault();
            });
			
            this.position();
        }
    };

    DictSimple.prototype.position = function () {
        this.ui.style.left = 0 + 'px';
        this.ui.style.top = 0 + 'px';
        var left, top, triangleLeft, triangleClass, clientRectForUI, clientRectForNode;
        clientRectForUI = this.ui.getBoundingClientRect();

        if (this.node) {
            clientRectForNode = this.node.getBoundingClientRect();
        }
        else {
            clientRectForNode = window.getSelection().getRangeAt(0).getBoundingClientRect();
        }

        this.x = clientRectForNode.left + document.body.scrollLeft;
        this.y = clientRectForNode.top + document.body.scrollTop;
        left = this.x - (clientRectForUI.width  - clientRectForNode.width) / 2;
        top = this.y - clientRectForUI.height - 5;

        if (left - document.body.scrollLeft < 0) {
            left = document.body.scrollLeft;
            triangleLeft = clientRectForNode.right - 18;
        }
        else if (left + clientRectForUI.width > document.body.clientWidth + document.body.scrollLeft) {
            left = document.body.clientWidth + document.body.scrollLeft - clientRectForUI.width;
            triangleLeft = this.x - left + 6;
        }
        else {
            triangleLeft = clientRectForUI.width / 2 - 6;
        }

        if (top - document.body.scrollTop < 0) {
            top = this.y + clientRectForNode.height + 10;
            triangleClass = 'up';
        }
        else {
            triangleClass = 'down';
        }
        this.ui.style.left = left + 'px';
        this.ui.style.top = top + 'px';
        this.ui.querySelector('div').style.left = triangleLeft + 'px';
        this.ui.querySelector('div').className = triangleClass;
    };

    var dict;

    document.addEventListener('DOMContentLoaded', function () {

	    chrome.extension.sendRequest({cmd: 'config'}, function (response) {
	        dict = new DictSimple({
	            skin: response.skin,
	            capture: response.capture
	        });
	    });

    }, false);
	
	  

})(this, this.document);
