/**
 * @apiDefine  FeeBack 反馈管理相关接口
 */
const  BaseDal = require('./BaseDal');
module.exports = class FeeBackOtherDal extends  BaseDal{
    /**
     * @api {POST} /feeBack/getFeeBackOtherPages *意见反馈分页查询
     * @apiGroup FeeBack
     * @apiParam {string} provinceid 省代区域代码
     * @apiParam {string} cityid　城市区域代码
     * @apiParam {string} areaid　区县区域代码
     * @apiParam {int}  school_id 学校id
     * @apiParam {int}  year 年级
     * @apiParam {int}  classes_id 班级id
     * @apiParam {int}  is_replyed  //0，未处理，1 已回复
     * @apiParam {int} user_id  用户id
     * @apiParam {int} pageIndex 第几页 //分页查询使用
     * @apiParam {int} pageCount  每页数量//分页查询使用
     * @apiSuccessExample 返回结果:
     *  {
    "code": "0x000000",
    "msg": "操作成功！",
    "data": {
        "count": 99,
        "backOtherList": [
            {
                "user_id": 968,
                "user_name": "GG",
                "school_name": "重庆市渝北区双湖小学校",
                "school_calsses_id": 46,
                "year": 2018,
                "classes_no": 1,
                "create_time": "2018-09-12 13:39:19",
                "rate": 5,//评分
                "errors": "题目答案残缺模糊,参考答案错误",//选择的错误
                "suggestion": "",//意见
                "contact": "",//联系方式
                "is_replyed": 0
            },。。。
            ]
     *
     */
    async getFeeBackOtherPages(req,res){
        try {
            let obj = {
                provinceid:req.body.provinceid||'',
                cityid:req.body.cityid||'',
                areaid:req.body.areaid||'',
                is_replyed:req.body.is_replyed||-1,
                school_id:req.body.school_id||-1,
                classes_id:req.body.classes_id||-1,
                year:req.body.year||-1,
                key:req.body.key||'',
                pageCount:parseInt(req.body.pageCount)||30,
                pageIndex:parseInt(req.body.pageIndex)||1
            };
            let data = await this.queryFeeBackOtherPages(obj);
            this.makeJSON(res, "SUCCESS", {result: 'success', data:data,msg:'查询成功'});
        }catch (e) {
            this.makeJSON(res, "DB_ERROR", {data: null, result: 'failed'});
            console.error('/feeBack/getFeeBackOtherPages'.e);
        }
    }
    async queryFeeBackOtherPages(obj){
        let pageCount = obj.pageCount;
        let pageIndex =  obj.pageIndex;
        let sql = `SELECT
                    u.id as user_id,
                    u.\`name\` as user_name,
                    s.school_name,
                    sc.id as school_calsses_id,
                    c.\`year\`,
                    c.classes_no,
                    DATE_FORMAT(t.create_time,"%Y-%m-%d %H:%i:%s") as create_time,
                    t.id as ticket_id,
                    t.rate,
                    t.errors,
                    t.suggestion,
                    t.contact,
                    t.is_replyed
                FROM  app_ticket t 
                LEFT JOIN   app_user u ON  u.id = t.app_user_id
                LEFT JOIN app_school s on u.school_id = s.id
                LEFT JOIN app_school_classes sc ON u.school_classes_id = sc.id
                LEFT JOIN app_classes c ON c.id =  sc.app_classes_id    
                `;
        let countSql = `SELECT
                    count(t.id) as count
                FROM  app_ticket t 
                LEFT JOIN   app_user u ON  u.id = t.app_user_id
                LEFT JOIN app_school s on u.school_id = s.id
                LEFT JOIN app_school_classes sc ON u.school_classes_id = sc.id
                LEFT JOIN app_classes c ON c.id =  sc.app_classes_id   `;

        try {
            let parameters = [];
            let whereSql = ' where 1 = 1';
            if(!this.util.isEmpty(obj.areaid)){
                whereSql = whereSql+' and s.area = ?';
                parameters.push(obj.areaid);
            }else if(!this.util.isEmpty(obj.cityid)){
                whereSql = whereSql+' and s.city = ? ';
                parameters.push(obj.cityid);
            }else if(!this.util.isEmpty(obj.provinceid)){
                whereSql =whereSql+ ' and s.province = ? ';
                parameters.push(obj.provinceid);
            }
            if(obj.is_replyed>-1){
                whereSql =whereSql+ ' and t.is_replyed = ? ';
                parameters.push(obj.is_replyed);
            }
            if(obj.school_id>-1){
                whereSql =whereSql+ ' and s.id = ? ';
                parameters.push(obj.school_id);
            }
            if(obj.year>-1){
                whereSql =whereSql+ ' and c.year = ?  ';
                parameters.push(obj.year);
            }
            parameters.push((pageIndex-1)*pageCount);
            parameters.push(pageCount);
            let  result = await this.query(`${sql} ${whereSql} ORDER BY create_time DESC limit ?,?`,{replacements:parameters,type:this.QueryTypes.SELECT});
            let  count = await this.query(`${countSql} ${whereSql} `,{replacements:parameters,type:this.QueryTypes.SELECT});
            return {'count':count[0].count,'backOtherList':result};
        }catch (e) {
             throw  e;
            console.error('queryFeeBackOtherPages',e)
        }
    }
    /**
     * @api {POST} /feeBack/processFeeBackOther *处理意见反馈
     * @apiGroup FeeBack
     * @apiParam {int} ticket_id
     * @apiParam {string} is_replyed  状态 0 ：未处理 1 处理
     * @apiParam {string} reply_content　处理备注学校 不能超过500个中文
     * @apiSuccessExample 返回结果:
     *  {
            "code": "0x000000",
            "msg": "操作成功！",
            "data": null
        }
     *
     */
    async processFeeBackOther(req,res){
        try {
            let user = this.getUserSessionInfo(req);
            let ticket_id = req.body.ticket_id;
            let is_replyed = req.body.is_replyed;
            let reply_content = req.body.reply_content||null;
            if(this.util.isEmpty(is_replyed) || !this.util.stringIsNumber(is_replyed)
                ||this.util.isEmpty(ticket_id) || !this.util.stringIsNumber(ticket_id)){
                this.makeJSON(res, "BAD_REQUEST", {data: null, result: 'failed'});
                return;
            }
            await  this.updateFeeBackOther(user.id,is_replyed,reply_content,ticket_id);
            this.makeJSON(res, "SUCCESS", {result: 'success', data:null,msg:'提交成功！'});
        }catch (e) {
            this.makeJSON(res, "SERVER_ERROR", {data: null, result: 'failed'});
            console.error('/feeBack/getFeeBackSchoolPages'.e);
        }
    }
    async updateFeeBackOther(user_id,is_replyed,reply_content,ticket_id){
        let sql = `update app_ticket set reply_time = now() , sys_user_id = ?,  is_replyed= ? ,reply_content = ? WHERE id = ?`;
        let result =await this.query(sql,{replacements:[user_id,is_replyed,reply_content,ticket_id],type:this.QueryTypes.UPDATE});
    }
};