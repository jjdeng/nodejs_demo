/**
 * @apiDefine  Login 登录相关接口
 */
'use strict';
const BaseDal = require('./BaseDal');
const session = require('express-session');
const nodeuuid = require('node-uuid');
const RoleDal = require('./SysRolesDal');
module.exports = class LoginDal extends BaseDal {
    /**
     * @api {POST} /login/loginUserPwd *用户密码登录
     * @apiGroup Login
     * @apiParam {string} account 账号  sysadmin
     * @apiParam {string} password 密码  sysadmin
     * @apiSuccessExample 返回结果:
     *  {
    "code": "0x000000",
    "msg": "操作成功！",
    "data": {
        "userInfo": {
            "id": 1,
            "account": "sysadmin",
            "role_id": 1,
            "role_type": 0
        },
        "menuList": [
            {
                "id": 5,
                "parent_id": 0,
                "menu_name": "APP管理",
                "menu_path": null,
                "menu_level": 1,
                "menu_index": 2,
                "children": [
                    {
                        "id": 6,
                        "parent_id": 5,
                        "menu_name": "用户管理",
                        "menu_path": null,
                        "menu_level": null,
                        "menu_index": 1,
                        "children": []
                    }
                ]
            },
            ......
            ]
     *
     */
    async loginUserPwd(req, res) {
        let account = req.body.account;
        let password = req.body.password;
        console.log(this.util.getEncMD5(this.util.getTrimedStr(password)));
        if (this.util.isEmpty(account) || this.util.isEmpty(password)) {
            this.makeJSON(res, "BAD_REQUEST",{data:null,result:'failed',msg:'账号/密码不能空'});
            return;
        }
        console.log(new Date().toLocaleString( )+"   执行登录："+account);
        let sql = 'select sys_user.id,sys_user.account,sys_user.role_id,sys_role.role_type from sys_user LEFT JOIN sys_role ON sys_user.role_id=sys_role.id where account = ? and password = ?';

        try{
            let userInfo = await this.query(sql,{replacements: [account,this.util.getEncMD5(this.util.getTrimedStr(password))],type:this.QueryTypes.SELECT});
            if(userInfo==null || userInfo.length<=0){
                this.makeJSON(res,"BAD_REQUEST", {code:'0x000010',msg:'用户不存在或密码错误！',data:null,result:'failed'});
                return;
            }
            console.log(userInfo[0]);
            let roleDal = new RoleDal();
            let menuList = await roleDal.getMenuByRoleId(userInfo[0].role_id,res,userInfo[0].id);
            menuList = await roleDal.getTreas(menuList,0);
            this.setUserSessionInfo(req, userInfo[0]);
            this.makeJSON(res, "SUCCESS", {data:{'userInfo':userInfo[0],'menuList':menuList},result:'success'});
        }catch (error){
            this.makeJSON(res, "DB_ERROR", {data:null,result:'failed'});
            console.error('router:/login/loginUserPwd');
            console.error(error);
        }
    }
    /**
     * @api {POST} /login/outLogin *退出登录
     * @apiGroup Login
     * @apiSuccessExample 返回结果:
     *  {
     *      "code": "0x000000", //
     *      "msg": "退出成功！"
     *     “data":null
     *  }
     *
     */
    async  outLogin(req, res){
        try {
            req.session.destroy();
            this.makeJSON(res, "SUCCESS", {result: 'success', data:null,msg:'退出成功'});
        } catch (error){
            this.makeJSON(res, "DB_ERROR", {data: null, result: 'failed'});
            console.log(error);
        }
    }
};

