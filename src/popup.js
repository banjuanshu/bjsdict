;(function (window, document, undefined) {
    var Popup = {
        createNew: function(){
            
            var popup = getInstance();
            
            function getInstance(){
                if(!this.instance){
                    this.instance = {};
                }
                return this.instance;
            };

            popup.setCaptureMode = function (e) {
                if (/green\.png\)$/.test(this.style.backgroundImage)) {
                    setting[this.dataset.index].status = false;
                    this.style.backgroundImage = 'url(../../assets/red.png)';
                }
                else {
                    setting[this.dataset.index].status = true;
                    this.style.backgroundImage = 'url(../../assets/green.png)';
                }
                
                localStorage.capture = JSON.stringify(setting);

                port.postMessage({cmd: 'setCaptureMode', capture: setting});
            };

            popup.tmpl = function(data) {
                var str = '', i, len;
                str += '<h2>' + data.key + '</h2>';
                if (data.pron) {
                    str += '<img class="horn" src="' + this.drawAlert(300, 300).toDataURL() + '"><audio id="audio" ><source src="' + data.pron + '" /></audio>';
                }
                if (data.ps) {
                    str += '<p><span>[ ' + data.ps + ' ]</span></p>';
                }
                for (i = 0, len = data.tt.length ; i < len ; i += 1) {
                    str += '<p><span>' + data.tt[i].pos + '</span> ' + data.tt[i].acceptation + '</p>';
                }
                return str;
            };

            popup.drawAlert = function(w, h) {
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

            popup.delegate = function(node, selector, type, handler) {
        
                node.delegate || (node.delegate = {});
                node.delegate[selector] = {handler: handler};
                this.delegate.nodeList || (this.delegate.nodeList = []);
                
                if (this.delegate.nodeList.indexOf(node) === -1) {
                    
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
                    this.delegate.nodeList.push(node);
                }
            };

            popup.dayone = function (){
                var html = '';

                $.ajax({
                    url: 'http://open.iciba.com/dsapi/',
                    type: 'GET',
                    dataType: 'json',
                    success: function(data){
                        html += '<h2>每日一句</h2><img class="horn" src="data:image/png;base64,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"><audio src='+data.tts+'></audio><br /><br />';
                        html += data.content + '<br /><br />';
                        html += '<p>';
                        html += data.note;
                        html += '</p>';
                        content.innerHTML = html;
                    }
                });
                
                content.innerHTML = '<h2>欢迎使用</h2>';
            };

            popup.run = function(){
                

            };

            return popup;
        }
    }

    var popup = Popup.createNew();
    var port = chrome.extension.connect({name: 'dict'}),
                searchbox = document.querySelector('textarea'),
                dict = document.querySelector('nav'),
                content = document.querySelector('section'),
                btnCapure = document.querySelectorAll('footer a'),
                setting = JSON.parse(localStorage.capture),
                rSingleWord = /^[a-z]+([-'][a-z]+)*$/i,
                dictCurrent = localStorage.mainDict,
                translateCurrent = localStorage.translate;

    document.addEventListener('DOMContentLoaded', function () {
        popup.dayone();
    });

    port.onMessage.addListener(function (msg) {
        if (msg.key === searchbox.value.trim()) {
            content.innerHTML = popup.tmpl(msg);
        }
    });

    for (var i = 0 ; i < btnCapure.length ; i += 1) {
        if (setting[i].status) {
            btnCapure[i].style.backgroundImage = 'url(../../assets/green.png)';
        }
        else {
            btnCapure[i].style.backgroundImage = 'url(../../assets/red.png)';
        }
        btnCapure[i].addEventListener('click', this.setCaptureMode, false);
        btnCapure[i].dataset.index = i;
    }

    searchbox.focus();
    searchbox.addEventListener('input', function (e) {
        var diff = this.scrollHeight - this.offsetHeight, key;
        if (diff) {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        }
        
        key = this.value.trim();
        
        patterns    = new RegExp(/^\d{4}-(0?[1-9]|1[0-2])-(0?[1-9]|[1-2]\d|3[0-1]) ([0-1]\d|2[0-3]):[0-5]\d:[0-5]\d$|^\d{4}-(0?[1-9]|1[0-2])-(0?[1-9]|[1-2]\d|3[0-1])$|^([0-1]\d|2[0-3]):[0-5]\d:[0-5]\d$/);//2014-05-01 19:55:00
        if(patterns.test(key))
        {
            d = $.myTime.DateToUnix(key);
            content.innerHTML = '<h2>' + d + '</h2>';
            return true;
        }
        else if(!isNaN(key) && key != '')
        {
            ymdhis = $.myTime.UnixToDate(key);
            
            content.innerHTML = '<h2>' + ymdhis + '</h2>';
            return true;
        }else if (rSingleWord.test(key)) 
        {
            
            if (!dict.querySelector('#dict .active')) {
                if (dict.querySelector('.active')) {dict.querySelector('.active').className = ''}
                dict.querySelector('a[rel='+dictCurrent+']').className = 'active';
            }
        }
        else 
        {
            if (!dict.querySelector('#translate .active')) {
                if (dict.querySelector('.active')) {dict.querySelector('.active').className = ''}
                dict.querySelector('a[rel='+translateCurrent+']').className = 'active';
            }
        }

        if (key.length > 0) {
            setTimeout(function () {
                if (e.target.value.trim() === key) {
                    content.innerHTML = '<h1>翻译中...</h1>';
                    port.postMessage({cmd: 'query', w: key, dict: dict.querySelector('.active').rel, type: dict.querySelector('.active').parentNode.id});
                }
            }, 1000);
        }
        else 
        {
            dayone();
            this.style.height = '28px';
        }
    }, false);

    popup.delegate(dict, 'a', 'click', function (e) {
        var target = this;
        
        if (target.className !== 'active') {
            if (dict.querySelector('.active')) {dict.querySelector('.active').className = '';}
            target.className = 'active';
            if(target.rel == 'zanzhu')
            {
                return ;
            }
            if (target.parentNode.id === 'dict') {
                dictCurrent = target.rel;
            }
            else {
                translateCurrent = target.rel;
            }
            if (searchbox.value.trim().length > 0) {
                port.postMessage({cmd: 'query', w: searchbox.value.trim(), dict: target.rel, type: target.parentNode.id});
            }
        }
        e.preventDefault();
    });

    popup.delegate(content, 'img', 'click', function () {
        this.nextSibling.play();
    });

    //当文件播放结束的时候，会抛出ended事件，捕获这个事件，然后强至播放器重新load
    $("body").delegate("img","click",function(){
       
        var x = document.getElementById("audio");
            x.addEventListener(
                'ended', 
                function(){
                    this.load();
                    this.load();
                }, 
                false
            );
    });
})(this, this.document);
