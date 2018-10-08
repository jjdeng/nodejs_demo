const  PhoneAreaDal = require('../dal/PhoneAreaDal');
const phoneAreaDal = new PhoneAreaDal();
module.exports = (router)=>{
    router.all('/phoneArea/pacthCheckPhoneArea',(req,res,next) => {
        console.log('批量检查用户手机号码归属地');
        phoneAreaDal.pacthCheckPhoneArea(req,res);
    });
}