;(function($) {
    $.extend({
        myTime: {
            /**
             * 当前时间戳
             * @return <int>        unix时间戳(秒)   
             */
            CurTime: function(){
                return Date.parse(new Date())/1000;
            },
            /**               
             * 日期 转换为 Unix时间戳 
             * @param <string> 2014-01-01 20:20:20  日期格式               
             * @return <int>        unix时间戳(秒)               
             */
            DateToUnix: function(string) {
                return d = Date.parse(string) / 1000;
            },
            /**               
             * 时间戳转换日期               
             * @param <int> unixTime    待时间戳(秒)               
             * @param <bool> isFull    返回完整时间(Y-m-d 或者 Y-m-d H:i:s)               
             * @param <int>  timeZone   时区               
             */
            UnixToDate: function(unixTime, isFull, timeZone) {
                isFull = true;
                var time = new Date(unixTime * 1000+8*60*60*1000);
                var ymdhis = "", lenght = 2;

                ymdhis += time.getUTCFullYear() + "-";
                ymdhis += this.padLeft(time.getUTCMonth()+1, lenght) + "-";
                ymdhis += this.padLeft(time.getUTCDate(), lenght);
                if (isFull === true)
                {
                    ymdhis += " " + this.padLeft(time.getUTCHours(), lenght) + ":";
                    ymdhis += this.padLeft(time.getUTCMinutes(), lenght) + ":";
                    ymdhis += this.padLeft(time.getUTCSeconds(), lenght);
                }

                return ymdhis;
            },
            
            padLeft: function(str, lenght){
        
                str = '' + str;
                if(str.length >= lenght)
                    return str;
                else
                    str = '0' + str;
                    return this.padLeft(str, lenght);
            } 
        }
    });
})(jQuery); 