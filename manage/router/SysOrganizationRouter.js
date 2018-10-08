const  Dal = require('../dal/SysOrganizationDal');
const sysOrganizationDal = new Dal();
const checkOrgUserLogin = require('../smart/CheckLogic').checkOrgUserLogin;
module.exports = (router)=>{
    router.all('/organization/*',(req,res,next) => {
        checkOrgUserLogin(req,res,next);
    });
    router.all('/organization/login',(req,res,next) => {
        sysOrganizationDal.login(req,res);
    });
    router.all('/organization/loginOut',(req,res,next) => {
        sysOrganizationDal.loginOut(req,res);
    });
    router.all('/organization/getOrgPromoteResultList',(req,res,next) => {
        sysOrganizationDal.getOrgPromoteResultList(req,res);
    });
    router.all('/organization/getOrgRiverResultList',(req,res,next) => {
        sysOrganizationDal.getOrgRiverResultList(req,res);
    });
    router.all('/organization/getOrgList',(req,res,next) => {
        sysOrganizationDal.getOrgList(req,res);
    });
    router.all('/organization/addOrg',(req,res,next) => {
        sysOrganizationDal.addOrg(req,res);
    });
    router.all('/organization/updateOrg',(req,res,next) => {
        sysOrganizationDal.updateOrg(req,res);
    });
    router.all('/organization/deleteOrg',(req,res,next) => {
        sysOrganizationDal.deleteOrg(req,res);
    });
    router.all('/organization/updateRelationBetweenOAndS',(req,res,next) => {
        sysOrganizationDal.updateRelationBetweenOAndS(req,res);
    });
    router.all('/organization/deleteRelationBetweenOAndS',(req,res,next) => {
        sysOrganizationDal.deleteRelationBetweenOAndS(req,res);
    });
    router.all('/organization/getSchoolListByOrg',(req,res,next) => {
        sysOrganizationDal.getSchoolListByOrg(req,res);
    });
    router.all('/organization/getOrgPromoteResult',(req,res,next) => {
        sysOrganizationDal.getOrgPromoteResult(req,res);
    });
    router.all('/organization/getOrgPromoteResultListForManage',(req,res,next) => {
        sysOrganizationDal.getOrgPromoteResultListForManage(req,res);
    });
    router.all('/organization/getAppUserByOrg',(req,res,next) => {
        sysOrganizationDal.getAppUserByOrg(req,res);
    });
    router.all('/organization/getSchoolDataByOrg',(req,res,next) => {
        sysOrganizationDal.getSchoolDataByOrg(req,res);
    });
};