/**
 * @apiDefine Auser  App用户管理管理接口
 */
const  BaseDal = require('./BaseDal');
module.exports = class SysAppUerDal extends  BaseDal{
    /**
     * @api {POST} /classes/selectAUsers *查询APP用户信息
     * @apiGroup Auser
     * @apiParam {int} id  app用户id
     * @apiParam {string} name 姓名
     * @apiParam {int} school_id 学校id
     * @apiParam {int} classes_id 班id
     * @apiParam {int} pageIndex 第几页 //分页查询使用
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
    async selectAUsers(req,res){
        try {
            let auser = await this.getAUser(req,res);
            let sql  = 'SELECT id, app_school_id,year,classes_name,classes_no,student_amount FROM xxy_db.app_classes WHERE';
            let sqlcount  = 'SELECT count(id) as count FROM xxy_db.app_classes   WHERE ';
            let params = await this.getParamteAUser(auser);
            let parameters = params.parameters;
            parameters.push((clazz.pageIndex-1)*clazz.pageCount);
            parameters.push(clazz.pageCount);
            let clazzList =await this.query(sql+params.whereSql+' limit ?,? ',{replacements:parameters,type:this.QueryTypes.SELECT});
            let count =await this.query(sqlcount+params.whereSql,{replacements:parameters,type:this.QueryTypes.SELECT});
        }catch (error) {
            this.makeJSON(res, "DB_ERROR", {data: null, result: 'failed'});
            console.error('router: /classes/selectAUsers');
            console.log(error);
        }
    }
    async getAUser(req){
        return {
            'id':parseInt(req.body.id),
            'name':req.body.app_school_id||null,
            'school_id':req.body.year||'',
            'classes_id':req.body.classes_no||'',
            'pageIndex':parseInt(req.body.pageIndex)||1,
            'pageCount':parseInt(req.body.pageCount)||30
        }
    }
    /**
     *
     * @param user
     * @returns {'parameters':[],whereSql:'and name = zhans  and account= qwerrtt'}
     */
    async getParamteAUser(auser){
        // let result={'parameters':[],whereSql:''};
        let parameters = [];
        let whereSql = ' 1=1 ';
        if(!this.util.isEmpty(auser.school_id)){
            whereSql =whereSql+ ' and school_id = ? ';
            parameters.push(auser.school_id);
        }
        if(!this.util.isEmpty(auser.name)){
            whereSql = whereSql+' and name = ?';
            parameters.push(auser.year);
        }
        if(!this.util.isEmpty(auser.classes_id)){
            whereSql = whereSql+' and classes_id = ? ';
            parameters.push(auser.classes_id);
        }
        console.log(whereSql);
        return {'parameters':parameters,'whereSql':whereSql};
    }
}