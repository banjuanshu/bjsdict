(function (exports) {

    var database = openDatabase('dict', '1.0', 'dict database', 5 * 1024 * 1024);
    database.transaction(function (tx) {
        tx.executeSql('DROP TABLE IF EXISTS dict')
        tx.executeSql('CREATE TABLE IF NOT EXISTS dicty (word text, api text, content text, PRIMARY KEY (word, api))');
    }, function (err) {
        console.log(err)
    });

    var API = {
        powerword: {
            type: 'dict',
            //url: 'http://dict-co.iciba.com/api/dictionary.php',
			url: 'http://banjuanshu.com/api/dict/translation/',
            data: 'w=?',
            method: 'get',
            dataType: 'xml',
            parse: function (res) {
                var xml = res, ret = {tt:[]}, element;
                element = xml.getElementsByTagName('acceptation');
                if (element.length) {
                    $.each(element, function (index, item) {
                        var pos = item.previousSibling.previousSibling;
                        ret.tt.push({
                            pos: (pos.tagName.toLowerCase() === 'pos' || pos.tagName.toLowerCase() === 'fe') ? pos.firstChild.nodeValue : '',
                            acceptation: item.firstChild.nodeValue
                        });
                    });

                    element = xml.getElementsByTagName('ps')[0];
                    ret.ps = element ? element.firstChild.nodeValue : '';

                    element = xml.getElementsByTagName('pron')[0];
                    ret.pron = element ? element.firstChild.nodeValue.trim() : '';
					
                    return ret;
                }
            }
        },
        bing: {
            type: 'dict',
            url: 'http://dict.bing.com.cn/io.aspx',
            data: 't=dict&ut=default&ulang=ZH-CN&tlang=EN-US&q=?',
            method: 'post',
            dataType: 'text',
            parse: function (res) {
                var ret = {tt:[]}, element;
                res = JSON.parse(res).ROOT;
                if (res.DEF) {
                    ret.ps = res.PROS.PRO ? (res.PROS.PRO.length ? res.PROS.PRO[0].$ : res.PROS.PRO.$) : '';
					ret.pron = res.AH ? 'http://media.engkoo.com:8129/en-us/' + res.AH.$ + '.mp3' : '';
					//ret.pron = res.AH ? 'https://translate.google.com/translate_tts?ie=UTF-8&q='+res.$INPUT+'&tl=en&total=1&idx=0&textlen=3&client=t&prev=input' : "";

                    element = res.DEF[0].SENS;
                    if (element) {
                        if (!element.length) {element = [element];}
                        $.each(element, function (index, item) {
                            var t;
                            if (item.SEN.length) {
                                t = [];
                                for (var i = 0; i < item.SEN.length ; i += 1) {
                                    t.push(item.SEN[i].D.$);
                                }
                                t = t.join(',')
                            }
                            else {
                                t = item.SEN.D.$;
                            }

                            ret.tt.push({
                                pos: item.$POS + '.',
                                acceptation: t
                            });
                        });
						
                        return ret;
                    }
                }
            }
        },
        qqdict: {
            type: 'dict',
            url: 'http://dict.qq.com/dict',
            method: 'get',
            data: 'f=web&q=?',
            dataType: 'text',
            parse: function (res) {
                var ret = {tt: []}, element;
                res = JSON.parse(res);
                if (res.local) {
                    res = res.local[0];
                    ret.ps = res.pho ? res.pho[0] : '';
                    ret.pron = res.sd ? 'http://speech.dict.qq.com/audio/' + res.sd.substring(0, 3).split('').join('/') + '/' + res.sd + '.mp3' : '';
                    element = res.des;
                    if (element) {
                        $.each(element, function (index, item){
                            ret.tt.push({
                                pos: (item.p ? item.p : ''),
                                acceptation: item.d
                            });
                        });
                        return ret;
                    }
                }
            }
        },
        youdao: {
            type: 'translate',
            url: 'http://fanyi.youdao.com/translate?smartresult=dict&smartresult=rule&smartresult=ugc&sessionFrom=http://dict.youdao.com/',
            method: 'post',
            data: 'type=AUTO&doctype=json&xmlVersion=1.4&keyfrom=fanyi.web&ue=UTF-8&typoResult=true&flag=false&i=?',
            dataType: 'text',
            parse: function (res) {
                var ret = {};
                res = JSON.parse(res).translateResult;;
                if (res.length) {
                    var acceptation = '';
                    $.each(res, function (index, item) {
                        acceptation += item[0].tgt;
                    });
                    return {tt: [{pos: '', acceptation: acceptation}]};
                }
            }
        },
        baidu: {
            type: 'translate',
            //url: 'http://api.fanyi.baidu.com/api/trans/vip/translate',
            url: 'http://www.banjuanshu.com/api/baidu/dict/translation/',
            method: 'get',
            data: 'from=auto&to=auto&query=?',
            dataType: 'text',
            parse: function (res) {
                res = JSON.parse(res);
                var acceptation = '';
                if (res.trans_result && res.trans_result.length) {
                    $.each(res.trans_result, function (index, item) {
                        acceptation += item.dst;
                    });
                    return {tt: [{pos: '', acceptation: acceptation}]};
                }
            }
        },
        google: {
            type: 'translate',
            url: 'http://translate.google.com/translate_a/t',
            method: 'get',
            data: 'client=t&hl=zh-CN&sl=auto&tl=auto&text=?',
            dataType: 'text',
            parse: function (res) {
                var acceptation = '';
				
				res = res.replace(/\[/g, '');
				res = res.replace(/\]/g, '');
				res = res.replace(/\"/g, '');
				res = res.split(",");
				
				acceptation += res[0] + " " + res[2] + "<br />";
                return {tt: [{pos: '', acceptation: acceptation}]};
            }
        }
    };

    exports.Query = Class(API, {

        init: function (args) {

        },

        query: function (options) {
			
            var self = this,
                word = options.word,
                api = options.api,
                callback = options.callback,
                data = this[api].data.replace('?', encodeURIComponent(word));

            if (api === 'google' && /[\u4e00-\u9fa5]/.test(word)) {
                data = data.replace('sl=auto', 'sl=zh-CN').replace('tl=auto', 'tl=en');
            }


            $.ajax({
                url: self[api].url,
                type: self[api].method,
                data: data,
                dataType: self[api].dataType,
                success: function (response) {
                    var result = self[api].parse(response), dicts = [];
                    for (var key in API) {
                        if (API[key].type === self[api].type) {
                            dicts.push(key);
                        }
                    }
					
                    dicts.splice(dicts.indexOf(api), 1);
                    dicts.unshift(api);
                    if (result) {
                        result.key = word;
                        result.dicts = dicts;
                        result.type = self[api].type;
                        callback(result);
                    }
                    else {
                        callback({key: word, dicts: dicts, type: self[api].type, tt: [{pos: '', acceptation: '查询不到结果'}]});
                    }
                },
                error: function (response) {console.log(response)
                    var dicts = [];
                    for (var key in API) {
                        if (API[key].type === self[api].type) {
                            dicts.push(key);
                        }
                    }
                    dicts.splice(dicts.indexOf(api), 1);
                    dicts.unshift(api);
                    callback({key: word, dicts: dicts, type: self[api].type, tt: [{pos: '', acceptation: '出错了!'}]});
                }
            });
        }

    });
})(this);
