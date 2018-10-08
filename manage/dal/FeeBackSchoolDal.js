/**
 * @apiDefine  FeeBack 反馈管理相关接口
 */
const  BaseDal = require('./BaseDal');
module.exports = class FeeBackSchoolDal extends  BaseDal{
    /**
     * @api {POST} /feeBack/getFeeBackSchoolPages *学校反馈信息查询分页
     * @apiGroup FeeBack
     * @apiParam {string} privinceid 省代区域代码
     * @apiParam {string} cityid　城市区域代码
     * @apiParam {string} areaid　区县区域代码
     * @apiParam {int}  school_id 学校id
     * @apiParam {int}  year 年级
     * @apiParam {int}  classes_id 班级id
     * @apiParam {string} key  查询关键字
     * @apiParam {int} status  状态 0 未处理 1 处理　
     * @apiParam {int} pageIndex 第几页 //分页查询使用
     * @apiParam {int} pageCount  每页数量//分页查询使用
     * @apiSuccessExample 返回结果:
     *  {
    "code": "0x000000",
    "msg": "操作成功！",
    "data": {
                "count": 68,
                "backSchoolList": [
                    {
                        "user_id": 915,//用户id
                        "user_name": "tesy", 用户名称
                        "school_name": "重庆市渝北区双湖小学校", 学校
                        "school_calsses_id": 46,
                        "year": 2018, //年级
                        "classes_no": 1//班号
                        "create_time": "2018-09-11 17:06:55", //提交时间
                        "privinceid": "230000",
                        "privince": "黑龙江省",
                        "cityid": "230100",
                        "city": "哈尔滨市",
                        "areaid": "230101",
                        "area": "市辖区",
                        "back_school_name": "换手机就是",//反馈学校名称
                        "status": 0 //处理状态 0 未处理 1 处理
                    },....
            ]
     *
     */
    async getFeeBackSchoolPages(req,res){
        try {
            let obj = {
                privinceid:req.body.privinceid||'',
                cityid:req.body.cityid||'',
                areaid:req.body.areaid||'',
                status:req.body.status||-1,
                school_id:req.body.school_id||-1,
                classes_id:req.body.classes_id||-1,
                year:req.body.year||-1,
                key:req.body.key||'',
                pageCount:parseInt(req.body.pageCount)||30,
                pageIndex:parseInt(req.body.pageIndex)||1
            };
            let data = await  this.queryFeeBackSchoolPages(obj);
            this.makeJSON(res, "SUCCESS", {result: 'success', data:data,msg:'查询成功'});
        }catch (e) {
            this.makeJSON(res, "SERVER_ERROR", {data: null, result: 'failed'});
            console.error('/feeBack/getFeeBackSchoolPages'.e);
        }
    }
    async queryFeeBackSchoolPages(obj){
        let pageCount = obj.pageCount;
        let pageIndex =  obj.pageIndex;
        let sql = `SELECT
                     u.id as user_id,
                    u.\`name\` as user_name,
                    s.id as school_id,
                    s.school_name,
                    sc.id as school_calsses_id,
                    c.\`year\`,
                    c.classes_no,
                    DATE_FORMAT(i.create_time,"%Y-%m-%d %H:%i:%s") as create_time,
                    i.id as back_School_id,
                    i.privinceid,
                    i.privince,
                    i.cityid,
                    i.city,
                    i.areaid,
                    i.area,
                    i.school_name as back_school_name,
                    i.status
                FROM  app_idea_school i
                LEFT JOIN app_user u ON  u.id = i.app_user_id
                LEFT JOIN app_school s on u.school_id = s.id
                LEFT JOIN app_school_classes sc ON u.school_classes_id = sc.id
                LEFT JOIN app_classes c ON c.id =  sc.app_classes_id 
                `;
        let countSql = `SELECT
                    count(i.id) as count
                FROM  app_idea_school i
                LEFT JOIN app_user  u ON  u.id = i.app_user_id
                LEFT JOIN app_school s on u.school_id = s.id
                LEFT JOIN app_school_classes sc ON u.school_classes_id = sc.id
                LEFT JOIN app_classes c ON c.id =  sc.app_classes_id `;

        try {
            let parameters = [];
            let whereSql = 'where 1 = 1';
            if(!this.util.isEmpty(obj.areaid)){
                whereSql = whereSql+' and i.areaid = ?';
                parameters.push(obj.areaid);
            }else if(!this.util.isEmpty(obj.cityid)){
                whereSql = whereSql+' and i.cityid = ? ';
                parameters.push(obj.cityid);
            }else if(!this.util.isEmpty(obj.privinceid)){
                whereSql =whereSql+ ' and i.privinceid = ? ';
                parameters.push(obj.privinceid);
            }
            if(obj.status>-1){
                whereSql =whereSql+ ' and i.status = ? ';
                parameters.push(obj.status);
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
            console.log(result);
            console.log(count);
            return {'count':count[0].count,'backSchoolList':result};
        }catch (e) {
             throw  e;
             console.log('queryFeeBackSchoolPages',e)
        }
    }
    /**
     * @api {POST} /feeBack/processFeeBackSchool *处理学校反馈
     * @apiGroup FeeBack
     * @apiParam {int} back_School_id
     * @apiParam {string} status  状态 0 ：未处理 1 c处理
     * @apiParam {string} remark　处理备注学校 不能超过500个中文
     * @apiSuccessExample 返回结果:
     *  {
            "code": "0x000000",
            "msg": "操作成功！",
            "data": null
        }
     *
     */
    async processFeeBackSchool(req,res){
        try {
            let user = this.getUserSessionInfo(req);
            let back_School_id = req.body.back_School_id;
            let status = req.body.status;
            let remark = req.body.remark||null;
            if(this.util.isEmpty(status) || !this.util.stringIsNumber(status)
                ||this.util.isEmpty(back_School_id) || !this.util.stringIsNumber(back_School_id)){

                this.makeJSON(res, "BAD_REQUEST", {data: null, result: 'failed'});
                return;

            }
            await  this.updateFeeBackSchool(user.id,status,remark,back_School_id);
            this.makeJSON(res, "SUCCESS", {result: 'success', data:null,msg:'提交成功！'});
        }catch (e) {
            this.makeJSON(res, "SERVER_ERROR", {data: null, result: 'failed'});
            console.error('/feeBack/getFeeBackSchoolPages'.e);
        }
    }
    async updateFeeBackSchool(user_id,status,remark,back_School_id){
        let sql = `update app_idea_school set sys_user_id = ?, status = ? ,remark = ? WHERE id = ?`;
        let result =await this.query(sql,{replacements:[user_id,status,remark,back_School_id],type:this.QueryTypes.UPDATE});
    }
};