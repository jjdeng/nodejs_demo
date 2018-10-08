const codeConf = require("../config/code.config");
const authConf = require("../config/auth.config");
//const getSession = require("./Util").getSession;
const Util = require("./Util");
module.exports ={
    checkLogin:function checkLogin (req, res, next) {
        var nlList = authConf["NoNeedLogin"] || []
        var rpath = req.path.toLowerCase()
        let isNeedLogin = false
        for(let i = 0; i < nlList.length; i++){
            if(rpath == nlList[i].toLowerCase()){
                isNeedLogin = true
                break
            }
        }
        console.log(Util.getSession(req,'user'));
        if(!isNeedLogin&&!Util.getSession(req,'user')){
            console.log('未登录！！')
           return res.end(JSON.stringify(Object.assign({},codeConf["NOT_LOGIN"],null)));
        }
        next();
    },
    checkNotLogin: function checkNotLogin (req, res, next) {
        if (req.session.user) {
            return res.end(JSON.stringify(Object.assign({},codeConf["LOGINING"],null)));
        }
    },
    checkOrgUserLogin(req, res, next){
        let nlList = authConf["NoNeedLogin_org"] || []
        let rpath = req.path.toLowerCase()
        let isNeedLogin = false
        for(let i = 0; i < nlList.length; i++){
            if(rpath == nlList[i].toLowerCase()){
                isNeedLogin = true
                break
            }
        }
        if(!isNeedLogin&&!Util.getSession(req,'org_user')){
            console.log('未登录！！')
            return res.end(JSON.stringify(Object.assign({},codeConf["NOT_LOGIN"],null)));
        }
        next();
    }
};



