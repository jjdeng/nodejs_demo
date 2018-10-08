const  SysSchoolDal = require('../dal/SysSchoolDal');
const sysSchoolDal = new SysSchoolDal();
module.exports = (router)=>{
    router.all('/school/actionSchool',(req,res,next) => {
        sysSchoolDal.actionSchool(req,res);
    });
};