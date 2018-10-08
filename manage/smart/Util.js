let crypto = require('crypto');
const keyConfig = require('../config/key')
const fs = require('fs');
const path = require('path');
module.exports = {
    /**
     * 设置sesssion
     * @param {string} key 以"d-"为前缀的键值,会直接存储到session里面,不做json转换
     */
    setSession: function(req, key, val){
        if(key.indexOf("d-") == 0){
            req.session[key] = val
        }else{
            req.session.userId = val.id;
            req.session[key] = JSON.stringify(val)
        }
    },
    /**
     * 获取sesssion
     */
    getSession: function(req, key){
        let val = null
        if(req.session[key]){
            if(key.indexOf("d-") == 0){
                val = req.session[key]
            }else{
                val = JSON.parse(req.session[key])
            }
        }
        return val
    },
    /**
     * 判断val的类型是否为字符串
     */
    isString: function(val){
        return Object.prototype.toString.call(val) === "[object String]"
    },
    /**
     * 判断val的类型是否为数组
     */
    isNumber: function(val){
        return Object.prototype.toString.call(val) === "[object Number]"
    },
    /**
     * 判断val的类型是否为数组
     */
    isArray: function(val){
        return Object.prototype.toString.call(val) === "[object Array]"
    },
    /**
     * md5加密
     * @return 返回长度为32的加密字符串
     */
    getEncMD5: function(str){
        return crypto.createHash('md5').update(str+keyConfig.key, keyConfig["encode-type1"]).digest(keyConfig["encode-type2"])
    },
    /**
     * 转换时间
     */
    turnTimeToLocal: function(ctime){
        return ctime.toLocaleDateString() + " " + ctime.toLocaleTimeString()
    },
    /**
     * 个位的时间数字补充0
     */
    timeFixer: function(m){
        return m < 10 ? '0' + m : m
    },
    /**
     * 获取日期生成的序列号
     */
    getDateSeriesNumber: function(){
        let now = new Date()
        let year = now.getFullYear()
        let month = now.getMonth()+1
        let date = now.getDate()
        let hours = now.getHours()
        let minutes = now.getMinutes()
        let seconds = now.getSeconds()
        let rs = year.toString() + this.timeFixer(month).toString() + this.timeFixer(date).toString()
        rs +=  this.timeFixer(hours).toString() + this.timeFixer(minutes).toString() + this.timeFixer(seconds).toString()
        return rs
    },
    getDateYYYYMMDD: function(){
        let now = new Date();
        let year = now.getFullYear();
        let month = now.getMonth()+1;
        let date = now.getDate();
        let rs = year.toString() + this.timeFixer(month).toString() + this.timeFixer(date).toString();
        return rs
    },
    /**
     * 获取客户端IP
     */
    getClientIP: function(req) {
        let ip = ""
        let hxforward = req.header('x-forwarded-for')
        if(hxforward){
            var hxips = hxforward.split(',')
            ip = hxips[0]
        }
        if(!ip){
            ip = req.connection.remoteAddress
        }
        return ip
    },
    /**
     * 返回数据库响应处理结果
     * @return json
     * {
     *      flag: true-发生变动 false-未发生变动
     *      ...
     * }
     */
    getDbReply: function(res, type){
        let ctype = type || "normal"
        let flag = res.affectedRows > 0
        let reply = {"flag": flag}
        if(ctype == "insert"){
            reply["id"] = res.insertId
        }
        return reply
    },
    /**
     * 获取转换后的值
     * @param  {object} val
     * @param  {string} type 转换成什么类型
     * @return {object}
     */
    getTransformedVal: function(val, type){
        if(type == "bool"){
            val = typeof val == "string" && val === "true"
        }
        return val
    },
    /**
     * 获取将两边空白字符去除后的字符串
     */
    getTrimedStr: function(str){
        return str.replace(/(^\s+)|(\s+$)/g, "")
    },
    /**
     * 判断字符串是否为null和空串
     * @param str
     */
    isEmpty:function(str){
        return str==null || typeof(str)=="undefined"||(str.toString()).replace(/(^\s+)|(\s+$)/g, "")=='';
    },
    stringIsNumber(str){
        var reg = /[0-9]+/;
        return reg.test(str);
    },
    /**
     * 文件是否存在
     * @param path
     * @returns {boolean}
     */
    fsExistsSync:function(path) {
        try{
            fs.accessSync(path,fs.F_OK);
        }catch(e){
            return false;
        }
        return true;
    },
    createDirsSync:function(dirname) {
        if (fs.existsSync(dirname)) {
            return true;
        } else {
            if (this.createDirsSync(path.dirname(dirname))) {
                fs.mkdirSync(dirname);
                return true;
            }
        }
    },
    emptyDir:function(fileUrl){
        let files = fs.readdirSync(fileUrl);
        files.forEach(function(file){
            var stats = fs.statSync(fileUrl+'/'+file);
            if(stats.isDirectory()){
                emptyDir(fileUrl+'/'+file);
            }else{
                fs.unlinkSync(fileUrl+'/'+file);
                console.log("删除文件"+fileUrl+'/'+file+"成功");

            }
        });
    },
    /**
     * 获取下一个月
     * @param path
     * @returns {boolean}
     */
    getNextMonth(year,month){
        let nexYear=year;
        let nexMonth=Number(month)+1;
        if(nexMonth>12){
            nexYear=year+1;
            nexMonth=1;
        }
        nexMonth=nexMonth<10?'0'+nexMonth.toString():nexMonth.toString();
        return {
            nexYear,
            nexMonth
        }
    }

}