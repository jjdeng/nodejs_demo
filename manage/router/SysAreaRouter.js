const  AreaDal = require('../dal/SysAreaDal');
const areaDal = new AreaDal();
module.exports = (router)=>{
    router.all('/area/getProvices',(req,res,next) => {
        console.log('获取省数据');
        areaDal.getProvices(req,res);
    });
    router.all('/area/getCities',(req,res,next) => {
        console.log('获取城市数据');
        areaDal.getCities(req,res);
    });
    router.all('/area/getAreas',(req,res,next) => {
        console.log('获取区县数据');
        areaDal.getAreas(req,res);
    });
};