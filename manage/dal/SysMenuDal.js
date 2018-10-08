
const BaseDal = require('./BaseDal');
module.exports = class SysMenuDal extends BaseDal {
    /**
     * @api {POST} /sysMenu/getMenuList *查询菜单列表
     * @apiGroup SysRole
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
    async getMenuList(req,res){
        let menu = await this.getMenu(req);
        console.log(menu);
        let menuList = await this.selectMenus(menu,res);
        menuList = await this.getTreas(menuList,0);
        this.makeJSON(res, "SUCCESS", {data:menuList,result:'success'});
    }
    async selectMenus(menu,res){
        console.log('查询菜单列表');
        let copyMenu = menu;
        try {
            let selSql='SELECT id,parent_id,menu_name,menu_path,menu_level,menu_index FROM sys_menu where 1=1 ';
            let params = await this.getParamteMenu(copyMenu);
            let parameters = params.parameters;
            let menuList =await this.query(selSql+params.whereSql +" ORDER BY menu_index ASC ",{replacements:parameters,type:this.QueryTypes.SELECT});
            return menuList;
        }catch (error) {
            this.makeJSON(res, "DB_ERROR", {data: null, result: 'failed'});
            console.error('router:/sysMenu/selectMenus');
            console.log(error);
        }
    }
    /**
     *
     * @param user
     * @returns {'parameters':[],whereSql:'and name = zhans  and account= qwerrtt'}
     */
    async getParamteMenu(menu){
        let parameters = [];
        let whereSql = ' ';
        if(!this.util.isEmpty(menu.menu_path)){
            whereSql =whereSql+ ' and menu_path = ? ';
            parameters.push(menu.menu_path);
        }
        if(!this.util.isEmpty(menu.menu_name)){
            whereSql =whereSql+ ' and menu_name like ? ';
            parameters.push('%'+menu.menu_name+'%');
        }
        if(!this.util.isEmpty(menu.parent_id)){
            whereSql = whereSql+' and parent_id = ? ';
            parameters.push(menu.parent_id);
        }
        if(!this.util.isEmpty(menu.menu_level)){
            whereSql = whereSql+' and menu_level = ? ';
            parameters.push(menu.menu_level);
        }
        if(!this.util.isEmpty(menu.menu_index)&&this.util.stringIsNumber(menu.menu_index)){
            whereSql =whereSql+ ' and menu_index = ? ';
            parameters.push(menu.menu_index);
        }
        console.log(whereSql);
        return {'parameters':parameters,'whereSql':whereSql};
    }
    async getMenu(req){
        return {
            'id':parseInt(req.body.id)||null,
            'menu_name':req.body.menu_name||null,
            'menu_path':req.body.menu_path||null,
            'parent_id':req.body.parent_id||null,
            'menu_level':req.body.menu_level||null,
            'menu_index':req.body.menu_index||null,
            'pageIndex':parseInt(req.body.pageIndex)||1,
            'pageCount':parseInt(req.body.pageCount)||20
        }
    }
}