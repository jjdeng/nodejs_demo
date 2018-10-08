const  SysAppInfo = require('../dal/SysAppInfo');
const sysAppInfo = new SysAppInfo();
module.exports = (router)=>{
    router.all('/appInfo/selectAppInfos',(req,res,next) => {
        sysAppInfo.selectAppInfos(req,res);
    });
    router.all('/appInfo/deleteAppInfoAction',(req,res,next) => {
        sysAppInfo.deleteAppInfoAction(req,res);
    });
    router.all('/appInfo/addAppInfoAction',(req,res,next)=>{
        sysAppInfo.addAppInfoAction(req,res);
    });
    router.all('/appInfo/updateAppInfo',(req,res,next)=>{
        sysAppInfo.updateAppInfo(req,res);
    });
};