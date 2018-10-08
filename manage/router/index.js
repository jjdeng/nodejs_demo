const checkLogin = require('../smart/CheckLogic').checkLogin;
const LoginRouter = require('./LoginRouter');
const SysUserRouter = require('./SysUserRouter');
const  SysRoleRouter = require('./SysRoleRouter');
const  SysAreaRouter = require('./SysAreaRouter');
const  SysSchoolRouter = require('./SysSchoolRouter');
const  SysClassesRouter = require('./SysClassesRouter');
const  SysAppInfoRouter = require('./SysAppInfoRouter');
const  SysOrganizationRouter = require('./SysOrganizationRouter');
const  PhoneAreaRouter = require('./PhoneAreaRouter');
const  FeeBackSchoolRouter = require('./FeeBacklRouter');
module.exports = (router) => {
	router.all("*",(req, res, next) => {
		console.log(req.url);
        checkLogin(req, res, next);
	    // next();
	});
    LoginRouter(router);
    SysUserRouter(router);
    SysRoleRouter(router);
    SysAreaRouter(router);
    SysSchoolRouter(router);
    SysClassesRouter(router);
    SysAppInfoRouter(router);
    SysOrganizationRouter(router);
    PhoneAreaRouter(router);
    FeeBackSchoolRouter(router);
}