const  FeeBackSchoolDal = require('../dal/FeeBackSchoolDal');
const  FeeBackOtherDal = require('../dal/FeeBackOtherDal');
const  FeeBackbBookDal = require('../dal/FeeBackbBookDal');
let feeBackSchoolDal = new FeeBackSchoolDal();
let  feeBackOtherDal = new FeeBackOtherDal();
let  feeBackbBookDal = new FeeBackbBookDal();
module.exports = (router)=>{
    //学校反馈
    router.all('/feeBack/getFeeBackSchoolPages',(req,res,next) => {
        console.log('学校反馈分页查询');
        feeBackSchoolDal.getFeeBackSchoolPages(req,res);
    });//
    router.all('/feeBack/processFeeBackSchool',(req,res,next) =>{
        console.log('学校反馈处理');
        feeBackSchoolDal.processFeeBackSchool(req,res);
    });

    //意见反馈
    router.all('/feeBack/getFeeBackOtherPages',(req,res,next) => {
        console.log('意见反馈分页查询');
        feeBackOtherDal.getFeeBackOtherPages(req,res);
    });//
    router.all('/feeBack/processFeeBackOther',(req,res,next) => {
        console.log('意见反馈处理');
        feeBackOtherDal.processFeeBackOther(req,res);
    });
    //教辅反馈
    router.all('/feeBack/getFeeBackBookPages',(req,res,next) => {
        console.log('意见反馈分页查询');
        feeBackbBookDal.getFeeBackBookPages(req,res);
    });
    router.all('/feeBack/processFeeBackBook',(req,res,next) =>{
        console.log('意见反馈处理');
        feeBackbBookDal.processFeeBackBook(req,res);
    });
};