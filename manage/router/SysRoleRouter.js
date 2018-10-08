const  SysRolesDal = require('../dal/SysRolesDal');
const sysRolesDal = new SysRolesDal();
const SysMenuDal = require('../dal/SysMenuDal');
const sysMenuDal = new SysMenuDal();
module.exports = (router)=>{
    router.all('/sysRole/getRoleMenuList',(req,res,next) => {
        sysRolesDal.getRoleMenuList(req,res);
    });
    router.all('/sysRole/actionRole',(req,res,next) => {
        sysRolesDal.actionRole(req,res);
    });
    router.all('/sysMenu/getMenuList',(req,res,next) => {
        sysMenuDal.getMenuList(req,res);
    });
};