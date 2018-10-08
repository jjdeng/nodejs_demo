const  SysUser = require('../dal/SysUserDal');
const sysUser = new SysUser();
module.exports = (router)=>{
    router.all('/sysUser/actionUser',(req,res,next) => {
        sysUser.actionUser(req,res);
    });
    router.all('/sysUser/updatePasswd',(req,res,next) => {
        console.log('修改用户密码！');
        sysUser.updatePasswd(req,res);
    });
};