/**
 * @apiDefine  FeeBack 反馈管理相关接口
 */
const  BaseDal = require('./BaseDal');
module.exports = class FeeBackbBookDal extends  BaseDal{
    /**
     * @api {POST} /feeBack/getFeeBackBookPages *教辅反馈分页查询
     * @apiGroup FeeBack
     * @apiParam {string} provinceid 省代区域代码
     * @apiParam {string} cityid　城市区域代码
     * @apiParam {string} areaid　区县区域代码
     * @apiParam {int}  school_id 学校id
     * @apiParam {int}  year 年级
     * @apiParam {int}  classes_id 班级id
     * @apiParam {int}   status 处理状态
     * @apiParam {string} key  关键字
     * @apiParam {int} pageIndex 第几页 //分页查询使用
     * @apiParam {int} pageCount  每页数量//分页查询使用
     * @apiSuccessExample 返回结果:
     *  {
    "code": "0x000000",
    "msg": "操作成功！",
    ""data": {
        "count": 206,
        "backBookList": [
            {
                "user_id": 941,
                "user_name": "那你",
                "school_name": "龙溪小学校财信城市国际分部",
                "school_calsses_id": 21,
                "year": 2018,
                "classes_no": 1,
                "create_time": "2018-09-11 19:46:33",
                "search_text": ":9781345667777;",//搜索内容
                "book_grade": 0,//1-9分别对应一-九年级
                "ISBN_num": "9781345667777",//
                "book_cover_src": "/userData/941/feedback/feedback_20180911194633_6769.png",
                "book_version": null//版本
            },。。。
         ]
     *
     */
    async getFeeBackBookPages(req,res){
        try {
            let obj = {
                provinceid:req.body.provinceid||'',
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
            let data = await this.queryFeeBackBookPages(obj);
            this.makeJSON(res, "SUCCESS", {result: 'success', data:data,msg:'查询成功'});
        }catch (e) {
            this.makeJSON(res, "DB_ERROR", {data: null, result: 'failed'});
            console.error('/feeBack/getFeeBackOtherPages'.e);
        }
    }
    async queryFeeBackBookPages(obj){
        let pageCount = obj.pageCount;
        let pageIndex =  obj.pageIndex;
        let sql = `
                SELECT
                    u.id as user_id,
                    u.\`name\` as user_name,
                    s.school_name,
					  sc.id as school_calsses_id,
                    c.\`year\`,
                    c.classes_no,
                    DATE_FORMAT(bf.create_time,"%Y-%m-%d %H:%i:%s") as create_time,
                    bf.id as back_book_id ,
                    bf.status,
                    bf.search_text,
                    bf.book_grade,
                    bf.ISBN_num,
                    bf.book_cover_src,
                    v.text as book_version
                FROM  app_book_feedback bf 
                LEFT JOIN   app_user u ON  u.id = bf.app_user_id
                LEFT JOIN app_school s on u.school_id = s.id
                LEFT JOIN app_school_classes sc ON u.school_classes_id = sc.id
                LEFT JOIN app_classes c ON c.id =  sc.app_classes_id 
				  LEFT JOIN book_version v ON v.id = bf.book_version_id
                `;
        let countSql = `SELECT
                    count(bf.id) as count 
                FROM  app_book_feedback bf 
                LEFT JOIN   app_user u ON  u.id = bf.app_user_id
                LEFT JOIN app_school s on u.school_id = s.id
                LEFT JOIN app_school_classes sc ON u.school_classes_id = sc.id
                LEFT JOIN app_classes c ON c.id =  sc.app_classes_id 
				  LEFT JOIN book_version v ON v.id = bf.book_version_id   `;

        let parameters = [];
        let whereSql = 'where 1 = 1';
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
        if(obj.status>-1){
            whereSql =whereSql+ ' and bf.status = ? ';
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
        return {'count':count[0].count,'backBookList':result};

    }
    /**
     * @api {POST} /feeBack/processFeeBackBook *处理教辅反馈
     * @apiGroup FeeBack
     * @apiParam {int} back_book_id
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
    async processFeeBackBook(req,res){
        try {
            let user = this.getUserSessionInfo(req);
            let back_book_id = req.body.back_book_id;
            let status = req.body.status;
            let remark = req.body.remark||null;
            if(this.util.isEmpty(status) || !this.util.stringIsNumber(status)
                ||this.util.isEmpty(back_book_id) || !this.util.stringIsNumber(back_book_id)){

                this.makeJSON(res, "BAD_REQUEST", {data: null, result: 'failed'});
                return;

            }
            await  this.updateFeeBackBook(user.id,status,remark,back_book_id);
            this.makeJSON(res, "SUCCESS", {result: 'success', data:null,msg:'提交成功！'});
        }catch (e) {
            this.makeJSON(res, "SERVER_ERROR", {data: null, result: 'failed'});
            console.error('/feeBack/getFeeBackSchoolPages'.e);
        }
    }
    async updateFeeBackBook(user_id,status,remark,back_book_id){
        let sql = `update app_book_feedback set sys_user_id = ?, status = ? ,remark = ? WHERE id = ?`;
        let result =await this.query(sql,{replacements:[user_id,status,remark,back_book_id],type:this.QueryTypes.UPDATE});
    }
};