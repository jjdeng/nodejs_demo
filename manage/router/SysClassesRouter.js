const  SysClassesDal = require('../dal/SysClassesDal');
const sysClassesDal = new SysClassesDal();
module.exports = (router)=>{
    router.all('/classes/actionClasses',(req,res,next) => {
        sysClassesDal.actionClasses(req,res);
    });///classes/getYearClazzs
    router.all('/classes/getYearClazzs',(req,res,next) => {
        sysClassesDal.getYearClazzs(req,res);
    });
};