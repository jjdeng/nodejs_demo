/**
 * @apiDefine  SysRole 角色菜单相关接口
 */
const BaseDal = require('./BaseDal');
const SysMenuDal = require('./SysMenuDal');
module.exports = class SysRolesDal extends BaseDal{
    /**
     * @api {POST} /sysRole/actionRole *角色查询新增修改删除
     * @apiGroup SysRole
     * @apiParam {int} operateType 0 :查询分页 1:新增 2 :修改() 3: 删除
     * @apiParam {string} id  角色id  //删除 修改 必须
     * *@apiParam {Array} menu_ids 菜单id数组   如：[1,2,3,4,5]
     * @apiParam {string} role_name   角色名称
     * @apiParam {string} role_type 角色类型 //0：超级管理员 1其他角色
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
    async actionRole(req, res){
        let operateType = req.body.operateType;
        let role = await  this.getRole(req);
        console.log(role);
        //查询
        if(operateType==0){
            this.makeJSON(res, "SUCCESS", {result: 'success', data:await  this.selectRolesPages(role,res),msg:'查询成功'});
        }else if(operateType==1){//新增
            this.makeJSON(res, "SUCCESS", {result: 'success', data:await this.addRole(role, res),msg:'添加成功'});
        }else if(operateType==2){//更新
            this.makeJSON(res, "SUCCESS", {result: 'success', data: await this.updateRole(role,res),msg:'更新成功！'});
        }else if (operateType==3){//删除
            this.makeJSON(res, "SUCCESS", {result: 'success',data: await this.deleteRole(role,res),msg:'删除成功！'});
        }else{
            this.makeJSON(res,'BAD_REQUEST',{result:'failed',data:null,msg:'请求错误，不存在该请求！'});
        }
    }
    /**
     * @api {POST} /sysRole/getRoleMenuList *查询角色菜单列表
     * @apiGroup SysRole
     * @apiParam {int} role_id 角色id
     * @apiSuccessExample 返回结果:
     * {
    "code": "0x000000",
    "msg": "操作成功！",
    "data": [
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
        .........
       ]
     *
     */
    async getRoleMenuList(req,res){
        console.log('查询角色菜单类表（不分页）');
        let user = this.getUserSessionInfo(req);
        try {
            let role_id = req.body.role_id;
            let menuList;
            if(this.util.isEmpty(role_id)||!this.util.stringIsNumber(role_id)){
                this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'role_id为空或非法！'});
                return;
            }

             menuList  = await this.getMenuByRoleId(role_id,res,user.id);
            let menuTrea = await this.getTreas(menuList,0);
            this.makeJSON(res, "SUCCESS", {data:menuTrea,result:'success'});
        }catch (error) {
            this.makeJSON(res, "DB_ERROR", {data: null, result: 'failed'});
            console.error('router:/sysRoles/getMenuList');
            console.log(error);
        }
    }
    async addRole(role,res){
        console.log('添加角色');
        if(this.util.isEmpty(role.role_name)){
            this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'role_name为空或非法！'});
            return;
        }
        if(role.menu_ids ==null || !this.util.isArray(role.menu_ids)||role.menu_ids.length<=0){
            this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'menu_ids为空或非法！'});
            return;
        }
        try {
            let insRole = 'INSERT INTO sys_role(role_name,role_type) VALUES(?,?)';
            let intRoleMenu = 'INSERT INTO sys_role_menu(role_id,menu_id) VALUES(?,?)';
            await this.transaction(async t=>{
                let roleid = await this.query(insRole,{replacements:[role.role_name,role.role_type||1],transaction: t,type:this.QueryTypes.INSERT});
                console.log(roleid);
                console.log(this.util.isArray(role.menu_ids));
                if(role.menu_ids!=null&&this.util.isArray(role.menu_ids)&&role.menu_ids.length>0){
                    for(let i = 0;i<role.menu_ids.length;i++){
                        await this.query(intRoleMenu,{replacements:[roleid[0],role.menu_ids[i]],transaction: t,type:this.QueryTypes.INSERT});
                    }
                }
            });
        }catch (error) {
            this.makeJSON(res, "DB_ERROR", {data: null, result: 'failed'});
            console.log('router:/sysRole/addRole');
            console.log(error);
        }
    }
    async updateRole(role,res){
        console.log('更新角色');
        let setSql = 'set';
        let params = [];
        if(this.util.isEmpty(role.id)&&!this.util.stringIsNumber(role.id)){
            this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'角色id为空或非法！'});
            return;
        }
        if(role.menu_ids!=null&&!this.util.isArray(role.menu_ids)){
            this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'menu_ids非法！'});
            return;
        }
        if(this.util.isEmpty(role.role_name)){
            this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'角色名称role_name为空或非法！'});
            return;
        }else{
            setSql = setSql+'  role_name =?,';
            params.push(role.role_name);
        }
        if(!this.util.isEmpty(role.role_type)){
            setSql = setSql+'  role_type =?,';
            params.push(role.role_type);
        }
        params.push(role.id);
        console.log(setSql)
        console.log(params)
        try {
            let updateRole = ' update sys_role ' +setSql.substring(0,setSql.length-1)+' WHERE id = ?';
            let deleteRoleMenu = 'delete from  sys_role_menu   WHERE  role_id= ?';
            let intRoleMenu = 'INSERT INTO sys_role_menu(role_id,menu_id) VALUES(?,?)';
            await this.transaction(async t=>{
                await this.query(updateRole,{replacements:params,transaction: t,type:this.QueryTypes.UPDATE});
                if(role.menu_ids!=null&&role.menu_ids.length>0){
                    await this.query(deleteRoleMenu,{replacements:[role.id],transaction: t,type:this.QueryTypes.DELETE});
                    for(let i = 0;i<role.menu_ids.length;i++){
                        await this.query(intRoleMenu,{replacements:[role.id,role.menu_ids[i]],transaction: t,type:this.QueryTypes.INSERT});
                    }
                }
            });
        }catch (error) {
            this.makeJSON(res, "DB_ERROR", {data: null, result: 'failed'});
            console.log('router:/sysRole/updateRole');
            console.log(error);
        }
    }
    async deleteRole(role,res){
        console.log('删除角色');
        let copyid  = role.id;
        console.log(copyid);
        if(this.util.isEmpty(copyid)||!this.util.stringIsNumber(copyid)){
            this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'id为空或非法！'});
            return;
        }
        if(await this.isExistUser(copyid)){
            this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'存在该角色的用户，不能删除！'});
            return;
        }
        let delRole='DELETE FROM sys_role WHERE id = ?';
        let delRoleMenu='DELETE FROM sys_role_menu WHERE role_id = ?';
        try {
            await this.transaction(async t=>{
                await this.query(delRole,{replacements:[copyid],transaction: t,type:this.QueryTypes.DELETE});
                await this.query(delRoleMenu,{replacements:[copyid],transaction: t,type:this.QueryTypes.DELETE});
            });
            return {isSuccess:true};
        }catch (error) {
            this.makeJSON(res, "DB_ERROR", {data: null, result: 'failed'});
            console.log('router:/sysRole/deleteRole');
            console.log(error);
        }
    }
    async selectRolesPages(role,res){
        console.log('查询角色信息（分页）');
        let rolecopy = role;
        try {
            let selSql='SELECT id,role_name,role_type, DATE_FORMAT(create_time,"%Y-%m-%d %H:%i:%s") as create_time FROM sys_role where ';
            let countSql ='SELECT count(id) count FROM sys_role where ';
            let params = await this.getParamteRole(rolecopy);
            let parameters = params.parameters;
            parameters.push((rolecopy.pageIndex-1)*rolecopy.pageCount);
            parameters.push(rolecopy.pageCount);
            let roleList =await this.query(selSql+params.whereSql+' limit ?,? ',{replacements:parameters,type:this.QueryTypes.SELECT});
            let count =await this.query(countSql+params.whereSql,{replacements:parameters,type:this.QueryTypes.SELECT});
            if(count[0].count<=0||roleList==null||roleList.length<0){
                return {'count':count[0].count,'roleList':roleList};
            }
            for(let i = 0;i < roleList.length;i++) {
                let meniList = await  this.getMenuByRoleId(roleList[i].id, res);
                roleList[i].menuList = meniList
            }
            return {'count':count[0].count,'roleList':roleList};
        }catch (error) {
            this.makeJSON(res, "DB_ERROR", {data: null, result: 'failed'});
            console.error('router:/sysRole/selectRolesPages');
            console.log(error);
        }
    }
    /**
     * 更具role_id查询菜单权限
     * @param user
     * @param res
     * @returns {Promise<void>}
     */
    async getMenuByRoleId(role_id,res,user_id){
        console.log('角色菜单查询');
        try {
            let menuList;
            if(user_id == 0){
                let  sysMenuDal = new SysMenuDal();
                menuList =  sysMenuDal.selectMenus({},res)
            }else {
                let selSql = 'SELECT ' +
                    'sys_menu.id,' +
                    'sys_menu.parent_id,' +
                    'sys_menu.menu_name,' +
                    'sys_menu.menu_path,' +
                    'sys_menu.menu_level,' +
                    'sys_menu.menu_index ' +
                    'FROM sys_role_menu INNER JOIN sys_menu ON sys_role_menu.menu_id = sys_menu.id WHERE sys_role_menu.role_id=? ORDER BY menu_level ASC,menu_index ASC ';
                menuList = await this.query(selSql, {replacements: [role_id], type: this.QueryTypes.SELECT});
                //console.log(menuList);
            }
            return menuList;
        }catch (error) {
            this.makeJSON(res, "DB_ERROR", {data: null, result: 'failed'});
            console.error('router:/sysRoles/getMenuByRoleId');
            console.log(error);
        }
    }
    async isExistRole(roleId){
        let sqlRole = 'SELECT count(id) as count FROM sys_role where id=? ';
        let userCount =await this.query(sqlRole,{replacements:[roleId],type:this.QueryTypes.SELECT});
        console.log(userCount);
        return userCount[0].count>0;
    }
    async isExistUser(roleId){
        let sqlRole = 'SELECT count(id) as count FROM sys_user where role_id=? ';
        let roleCount =await this.query(sqlRole,{replacements:[roleId],type:this.QueryTypes.SELECT});
        console.log(roleCount);
        return roleCount[0].count>0;
    }
    /**
     *
     * @param user
     * @returns {'parameters':[],whereSql:'and name = zhans  and account= qwerrtt'}
     */
    async getParamteRole(role){
        let parameters = [];
        let whereSql = ' 1=1 ';
        if(!this.util.isEmpty(role.role_name)){
            whereSql =whereSql+ ' and role_name like ? ';
            parameters.push('%'+role.role_name+'%');
        }
        if(!this.util.isEmpty(role.role_type)&&this.util.stringIsNumber(role.role_type)){
            whereSql =whereSql+ ' and role_type = ? ';
            parameters.push(role.role_type);
        }
        console.log(whereSql);
        return {'parameters':parameters,'whereSql':whereSql};
    }
    async getRole(req){
        return {
            'id':parseInt(req.body.id)||null,
            'role_name':req.body.role_name||null,
            'role_type':req.body.role_type||null,
            'menu_ids':req.body.menu_ids||null,//[1,2,3,4]
            'pageIndex':parseInt(req.body.pageIndex)||1,
            'pageCount':parseInt(req.body.pageCount)||20
        }
    }
};