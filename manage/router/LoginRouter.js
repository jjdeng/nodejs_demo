const  LoginDal = require('../dal/LoginDal');
const loginDal = new LoginDal();
module.exports = (router)=>{
    router.all('/login/loginUserPwd',(req,res,next) => {
        console.log('登录，通过用户密码');
        loginDal.loginUserPwd(req,res);
    });//login/registerAccount
    router.all('/login/outLogin',(req,res,next) => {
        console.log('退出登录');
        loginDal.outLogin(req,res);
    });
};