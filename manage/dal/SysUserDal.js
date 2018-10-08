/**
 * @apiDefine  SysUser 用户相关接口
 */
'use strict';
const BaseDal = require('./BaseDal');
const session = require('express-session');
const nodeuuid = require('node-uuid');
const SysRolesDal = require('./SysRolesDal');
let sysRolesDal = new SysRolesDal();
module.exports = class SysUserDal extends BaseDal{
    /**
     * @api {POST} /sysUser/updatePasswd *修改密码
     * @apiGroup SysUser
     * @apiParam {string} oldPassword 老密码
     * @apiParam {string} newPasswordOne 新密码
     * @apiParam {string} newPasswordTwo 确认密码
     * @apiSuccessExample 返回结果:
     *  {
     *      "code": "0x000000", //
     *      "msg": "修改成功！"
     *     “data":null
     *  }
     *
     */
    async  updatePasswd(req, res){
        try {
            let user = this.getUserSessionInfo(req);
            let oldPassword = req.body.oldPassword;
            let newPasswordOne = req.body.newPasswordOne;
            let newPasswordTwo = req.body.newPasswordTwo;
            if(this.util.isEmpty(oldPassword) ){
                this.makeJSON(res, "BAD_REQUEST",{data:null,result:'failed',msg:'老密码不能为空或非法'});
                return;
            }
            if(this.util.isEmpty(newPasswordOne)){
                this.makeJSON(res, "BAD_REQUEST",{data:null,result:'failed',msg:'新密码不能为空或非法'});
                return;
            }
            if(this.util.isEmpty(newPasswordTwo)){
                this.makeJSON(res, "BAD_REQUEST",{data:null,result:'failed',msg:'确认密码不能为空或非法'});
                return;
            }
            if(newPasswordOne!=newPasswordTwo){
                this.makeJSON(res, "BAD_REQUEST",{data:null,result:'failed',msg:'新密码和确认密码不一致'});
                return;
            }
            user.password = oldPassword;
            let userInfos = await this.selectUsers(user,res);
            console.log(userInfos);
            if(userInfos ==null || userInfos.length<=0){
                this.makeJSON(res, "BAD_REQUEST",{data:null,result:'failed',msg:'密码不正确，请重新输入！'});
                return;
            }
            await this.updateUser({'id':user.id,'password':newPasswordOne},res);
            this.makeJSON(res, "SUCCESS", {result: 'success', data:null,msg:'修改成功'});
        } catch (error){
            this.makeJSON(res, "DB_ERROR", {data: null, result: 'failed'});
            console.log(error);
        }
    }
    /**
     * @api {POST} /sysUser/actionUser *用户查询新增修改删除
     * @apiGroup SysUser
     * @apiParam {int} operateType 0 :查询分页 1:新增 2 :修改() 3: 删除
     * @apiParam {string} id 用户id  //删除 修改 必须
     * @apiParam {string} account 账号
     * @apiParam {string} password 密码
     * @apiParam {string} name 用户名称
     * @apiParam {string} post 岗位
     * @apiParam {int} role_id 角色
     * @apiParam {int} pageIndex 页数 //分页查询使用
     * @apiParam {int} pageCount  每页数量//分页查询使用
     * @apiSuccessExample 返回结果:
     *  {
     *      "code": "0x000000", //
     *      "msg": "操作成功！"
     *     “data:{
     *
     *     }
     *  }
     *
     */
    async actionUser(req, res){
        let operateType = req.body.operateType;
        let user = await  this.getUser(req);
        console.log(user);
        //查询
        if(operateType==0){
            this.makeJSON(res, "SUCCESS", {result: 'success', data:await  this.selectUsersPages(user,res),msg:'查询成功'});
        }else if(operateType==1){//新增
            this.makeJSON(res, "SUCCESS", {result: 'success', data:await this.addUser(user, res),msg:'添加成功'});
        }else if(operateType==2){//更新
            this.makeJSON(res, "SUCCESS", {result: 'success', data: await this.updateUser(user,res),msg:'更新成功！'});
        }else if (operateType==3){//删除
            this.makeJSON(res, "SUCCESS", {result: 'success',data: await this.deleteUser(user,res),msg:'删除成功！'});
        }else{
            this.makeJSON(res,'BAD_REQUEST',{result:'failed',data:null,msg:'请求错误，不存在该请求！'});
        }
    }
    async selectUsersPages(user,res){
        console.log('查询用户信息');
        console.log(user.role_id);
        let usercpy = user;
        try {
            let selSql='select sys_user.id,sys_user.account,sys_user.`name`,sys_user.post,sys_user.role_id,sys_role.role_name,sys_role.role_type from sys_user LEFT JOIN sys_role ON sys_user.role_id=sys_role.id where ';
            let countSql ='select count(id) as count from sys_user where ';
            let params = await this.getParamteUser(user);
            let parameters = params.parameters;
            parameters.push((user.pageIndex-1)*user.pageCount);
            parameters.push(user.pageCount);
            let userList =await this.query(selSql+params.whereSql+' limit ?,? ',{replacements:parameters,type:this.QueryTypes.SELECT});
            let count =await this.query(countSql+params.whereSql,{replacements:parameters,type:this.QueryTypes.SELECT});
            return {'count':count[0].count,'userList':userList};
        }catch (error) {
            this.makeJSON(res, "DB_ERROR", {data: null, result: 'failed'});
            console.error('router:/user/selectUsersPages');
            console.log(error);
        }
    }
    async selectUsers(user,res){
        console.log('查询用户信息');
        let usercpy = user;
        try {
            let selSql='select sys_user.id,sys_user.account,sys_user.`name`,sys_user.post,sys_role.role_name,sys_role.role_type from sys_user LEFT JOIN sys_role ON sys_user.role_id=sys_role.id where ';
            let params = await this.getParamteUser(user);
            let parameters = params.parameters;
            let userList =await this.query(selSql+params.whereSql,{replacements:parameters,type:this.QueryTypes.SELECT});
            return userList;
        }catch (error) {
            this.makeJSON(res, "DB_ERROR", {data: null, result: 'failed'});
            console.error('router:/user/selectUsers');
            console.log(error);
        }
    }
    async  addUser(user, res){
        try {
            console.log(user);
            let usercpy = user;
            if(this.util.isEmpty(usercpy.account)){
                this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'账号不能为空！'});
                return;
            }
            if(this.util.isEmpty(usercpy.role_id)&&!this.util.stringIsNumber(usercpy.role_id)){
                this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'角色为空或非法!'});
                return;
            }
            if(!await sysRolesDal.isExistRole(usercpy.role_id)){
                this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'传入的角色id不存在！'});
                return;
            }
            let insertUser = 'INSERT into sys_user(account,password,role_id,name,post) VALUES(?,?,?,?,?)';
            let useIshava =await this.selectUsers({account:usercpy.account},res);
            if(useIshava!=null && useIshava.length>0){
                this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'该账号已经存在，请重新输入账号！'});
                return;
            }
            let p = await this.query(insertUser,{replacements: [usercpy.account,this.util.getEncMD5(this.util.getTrimedStr(usercpy.password)),usercpy.role_id,usercpy.name,usercpy.post],type: this.QueryTypes.INSERT });
            usercpy.password = '';
            return usercpy;
        } catch (error){
            this.makeJSON(res, "DB_ERROR", {data: null, result: 'failed'});
            console.error('router:/user/addUser');
            console.log(error);
        }
    }
    async deleteUser(user,res){
        let copyid  = user.id;
        console.log(copyid);
        if(this.util.isEmpty(copyid)||!this.util.stringIsNumber(copyid)){
            this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'userid为空或非法！'});
            return;
        }
        if(copyid==0){
            this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'你没有删除该用户的权限！'});
            return;
        }
        let delSql='DELETE FROM sys_user WHERE id = ?';
        try {
            let delUser = this.query(delSql,{replacements:[copyid],type:this.QueryTypes.DELETE});
            return {isSuccess:true};
        }catch (error) {
            this.makeJSON(res, "DB_ERROR", {data: null, result: 'failed'});
            console.log(error);
        }
    }
    async updateUser(user,res){
        try {
            let usercopy = user;
            console.log(usercopy);
            let setSql = 'set';
            let params = [];
            if(this.util.isEmpty(usercopy.id)||!this.util.stringIsNumber(usercopy.id)){
                this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'userid为空或非法！'});
                return;
            }
            if(!this.util.isEmpty(usercopy.account)){
                setSql = setSql+'  account =?,';
                params.push(usercopy.account);
            }
            if(!this.util.isEmpty(usercopy.name)){
                setSql = setSql+'   name = ?,';
                params.push(usercopy.name);
            }
            if(!this.util.isEmpty(usercopy.post)){
                setSql = setSql+'   post = ?,';
                params.push(usercopy.post);
            }
            if(!this.util.isEmpty(usercopy.role_id)&&this.util.stringIsNumber(usercopy.role_id)){
                if(!await sysRolesDal.isExistRole(usercopy.role_id)){
                    this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'传入的角色id不存在！'});
                    return;
                }
                setSql = setSql+'   role_id = ?,';
                params.push(usercopy.role_id);
            }
            if(!this.util.isEmpty(usercopy.password)){
                setSql = setSql+'   password = ?,';
                params.push(this.util.getEncMD5(this.util.getTrimedStr(usercopy.password)));
            }
            if(setSql=='set'){
                this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'传入的参数全为空！'});
                return;
            }
            params.push(usercopy.id);
            console.log(params);
            let updateSql='update sys_user '+
                setSql.substring(0,setSql.length-1)+'  WHERE id = ?';
            let delUser =await this.query(updateSql,{replacements:params,type:this.QueryTypes.UPDATE});
            return {isSuccess:true};
        }catch (error) {
            this.makeJSON(res, "DB_ERROR", {data: null, result: 'failed'});
            console.log(error);
        }
    }
    async getUser(req){
        return {
            'id':parseInt(req.body.id),
            'account':req.body.account,
            'password':req.body.password||'123456',
            'name':req.body.name||'',
            'role_id':req.body.role_id,
            'post':req.body.post||'',
            'pageIndex':parseInt(req.body.pageIndex)||1,
            'pageCount':parseInt(req.body.pageCount)||20
        }
    }
    /**
     *
     * @param user
     * @returns {'parameters':[],whereSql:'and name = zhans  and account= qwerrtt'}
     */
    async getParamteUser(user){
        // let result={'parameters':[],whereSql:''};
        let parameters = [];
        let whereSql = ' 1=1 ';
        if(!this.util.isEmpty(user.account)){
            whereSql =whereSql+ ' and account = ? ';
            parameters.push(user.account);
        }
        if(!this.util.isEmpty(user.name)){
            whereSql =whereSql+ ' and name like ? ';
            parameters.push('%'+user.name+'%');
        }
        if(!this.util.isEmpty(user.post)){
            whereSql = whereSql+' and post = ? ';
            parameters.push(user.post);
        }
        if(!this.util.isEmpty(user.password)){
            whereSql = whereSql+' and password = ? ';
            parameters.push(this.util.getEncMD5(this.util.getTrimedStr(user.password)));
        }
        if(!this.util.isEmpty(user.role_id)&&this.util.stringIsNumber(user.role_id)){
            whereSql =whereSql+ ' and role_id = ? ';
            parameters.push(user.role_id);
        }
        console.log(whereSql);
        return {'parameters':parameters,'whereSql':whereSql};
    }
};

