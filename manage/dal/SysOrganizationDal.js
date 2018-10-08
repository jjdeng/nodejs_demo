/**
 * @apiDefine  Organization 机构相关接口
 */
'use strict';
const BaseDal = require('./BaseDal');
//每个机构下载体验的sql语句 单个用户APP下载注册+成为预备小河长（完成答题）
const sql_downloads=`
    SELECT
    m.\`sys_org_id\` ,
    COUNT(d.id) AS user_num
    FROM sys_org_school AS m
    LEFT JOIN (
    SELECT 
    u.\`id\`,
    u.\`school_id\`
    FROM app_user AS u
    INNER JOIN river_score AS s
    ON u.\`id\`=s.\`app_user_id\`
    WHERE s.\`is_answer\`=1
    ) AS d
    ON d.school_id=m.\`app_school_id\`
    GROUP BY m.\`sys_org_id\`
`
//每个机构后续使用的sql语句 单个用户完成3次作业检查
const sql_keepUsing=`
    SELECT
    m.\`sys_org_id\` ,
    COUNT(d.id) AS user_num
    FROM sys_org_school AS m
    LEFT JOIN (
    SELECT
    u.\`id\`,
    u.\`school_id\`,
    COUNT(l.\`id\`) AS total
    FROM app_user AS u
    LEFT JOIN app_handle_logs AS l
    ON l.\`app_user_id\`=u.\`id\`
    AND l.\`app_handle_id\` IN (3,6)
    GROUP BY u.\`id\`
    ) AS d
    ON d.school_id=m.\`app_school_id\`
    AND d.total >= 3
    GROUP BY m.\`sys_org_id\`
`
//每个机构发展小河长数量的sql语句 单个用户参与线上活动，完成5个污染物打捞即可成为小河长
const sql_riverChief=`
    SELECT m.sys_org_id,COUNT(d.id) AS user_num 
    FROM sys_org_school AS m
    LEFT JOIN ( 
    SELECT 
    u.\`id\`,
    u.\`school_id\`
    FROM app_user AS u
    INNER JOIN app_score_gift_record AS l
    ON l.\`app_user_id\`=u.\`id\`
    AND l.\`app_gift_id\` = 10
    GROUP BY u.\`id\`
    ) AS d
    ON m.\`app_school_id\`=d.\`school_id\`
    GROUP BY m.\`sys_org_id\`
`
//查询所有机构的下载体验人数，后续使用人数，小河长数量，当前月份小河长数量
let sql_promote=`
    SELECT
    o.id,
    o.name,
    o.isFoul,
    o.province AS provinceid,
    p.\`province\`,
    c.\`city\`,
    a.\`area\`,
    r1.user_num AS user_num_1,
    r2.user_num AS user_num_2,
    r3.user_num AS user_num_3,
    r4.user_num AS user_num_4,
    r1.user_num+r2.user_num+r3.user_num AS user_num_all
    FROM sys_organization AS o
    INNER JOIN ( ${sql_downloads} ) AS r1
    ON o.\`id\`=r1.sys_org_id
    INNER JOIN ( ${sql_keepUsing} ) AS r2
    ON o.\`id\`=r2.sys_org_id
    INNER JOIN( ${sql_riverChief} ) AS r3
    ON o.\`id\`=r3.sys_org_id
    INNER JOIN(
    SELECT m.sys_org_id,COUNT(d.id) AS user_num 
    FROM sys_org_school AS m
    LEFT JOIN (
        SELECT 
        u.\`id\`,
        u.\`school_id\`
        FROM app_user AS u
        INNER JOIN app_score_gift_record AS l
        ON l.\`app_user_id\`=u.\`id\`
        AND l.\`app_gift_id\` = 10
        AND l.\`create_time\`>= ?
        AND l.\`create_time\`< ?
        GROUP BY u.\`id\`
    ) AS d
    ON m.\`app_school_id\`=d.\`school_id\`
    GROUP BY m.\`sys_org_id\`	
    ) AS r4
    ON o.\`id\`=r4.sys_org_id
    LEFT JOIN app_provinces AS p
    ON p.\`provinceid\`=o.\`province\`
    LEFT JOIN app_cities AS c
    ON c.\`cityid\`=o.\`city\`
    LEFT JOIN app_areas AS a
    ON a.\`areaid\`=o.\`area\`
    WHERE o.id > 1
`
module.exports = class SysOrganizationDal extends BaseDal{
    /**
     * @api {POST} /organization/getOrgList  查询机构列表
     * @apiGroup Organization
     *
     * @apiParam {int} offset   从第几行开始，比如0表示从第一条开始，10表示从第11条开始
     * @apiParam {int} limit   获取多少条数据
     * @apiParam {string} [search]   按照名字进行搜索
     * @apiParam {int} [DESC]   如果是0表示升序如果是1表示降序，按照ID来排列，默认是升序
     *
     * @apiSuccessExample 返回结果:
     * {
            "code": "0x000000",
            "msg": "查询成功",
            "result": "success",
            "data": [
               {
                    "id": 1,
                    "name": "测试机构1",
                    "province": "110000",
                    "city": "110100",
                    "area": "110101",
                    "address": "幸福巷与福光路交叉口西北100米",
                    "create_time": "2018-09-05T03:41:28.000Z",
                    "update_time": "2018-09-05T03:42:14.000Z",
                    "province_n": "北京市",
                    "city_n": "市辖区",
                    "area_n": "东城区"
                },....
            ]
        }
     *
     */
    async getOrgList(req,res){
        try {
            let org_user=this.util.getSession(req,'org_user');
            if(org_user.id!=1){
                this.makeJSON(res, "BAD_REQUEST", {msg:'用户无权限！',data:null,result:'failed'});
                return
            }
            let parameters=[
                ['offset','number'],//1-12
                ['limit','number'],
                ['search','string',true],
                ['DESC','number',true]
            ];
            let checkParameters=this.checkParametersType(res,req.body,parameters);//检查参数是否齐全,以及类型是否正确
            if(!checkParameters){
                return;
            }
            let offset=req.body.offset;
            let limit=req.body.limit;
            let sql=`SELECT b.*,p.\`province\` AS province_n,c.\`city\` AS city_n,a.\`area\` AS area_n FROM sys_organization AS b LEFT JOIN app_provinces AS p ON p.\`provinceid\`=b.\`province\` LEFT JOIN app_cities AS c ON c.\`cityid\`=b.\`city\` LEFT JOIN app_areas AS a ON a.\`areaid\`=b.\`area\``
            let sql2=`SELECT COUNT(\`id\`) AS \`total\` FROM sys_organization AS b`
            if(req.body.search && req.body.search!=''){
                sql=sql+` WHERE b.\`name\` LIKE '%${req.body.search }%' `
                sql2=sql2+` WHERE b.\`name\` LIKE '%${req.body.search }%' `
            }
            if(req.body.DESC && req.body.DESC==1){
                sql=sql+` ORDER BY b.\`id\` DESC`
            }
            const p=await this.query(sql+' LIMIT ?,?',{replacements:[Number(offset),Number(limit)],type:this.QueryTypes.SELECT})
            const r=await this.query(sql2,{type:this.QueryTypes.SELECT});
            this.makeJSON(res, "SUCCESS", {data:p,result:'success',...r[0]});
        }catch (error) {
            if(error.name && error.name=='SequelizeDatabaseError'){
                this.makeJSON(res, "DB_ERROR", {data:null,result:'failed'});
            }else{
                this.makeJSON(res, "SERVER_ERROR", {data:null,result:'failed'});
            }
            console.error('/organization/getOrgList',error);
        }
    }
    /**
     * @api {POST} /organization/addOrg 新增机构
     * @apiGroup Organization
     *
     * @apiParam {string} name   名字
     * @apiParam {int} province  省份代码
     * @apiParam {int} city   同上
     * @apiParam {int} area    同上
     * @apiParam {string} address 详细地址
     *
     * @apiSuccessExample 返回结果:
     *  {
     *      "code": "0x000000",
     *      "msg": "操作成功！"
     *      "data":null
     *      msg:'操作成功',
     *      result:'success'
     *  }
     */
    async addOrg(req,res){
        //必传参数
        let parameters=[
            ['name','string'],
            ['province','number'],
            ['city','number'],
            ['area','number'],
            ['address','string']
        ];
        let checkParameters=this.checkParametersType(res,req.body,parameters);//检查参数是否齐全,以及类型是否正确
        if(!checkParameters){
            return;
        }
        try {
            let org_user=this.util.getSession(req,'org_user');
            if(org_user.id!=1){
                this.makeJSON(res, "BAD_REQUEST", {msg:'用户无权限！',data:null,result:'failed'});
                return
            }
            if(typeof req.body.province !== 'undefined'){
                let p=await this.query('SELECT id FROM app_provinces where provinceid =?',{replacements:[req.body.province],type:this.QueryTypes.SELECT});
                if(p.length==0){
                    this.makeJSON(res, "BAD_REQUEST", {msg:'非法的province,不存在',data:null,result:'failed'});
                    return
                }
            }
            if(typeof req.body.city !== 'undefined'){
                let p=await this.query('SELECT id FROM app_cities where cityid =?',{replacements:[req.body.city],type:this.QueryTypes.SELECT});
                if(p.length==0){
                    this.makeJSON(res, "BAD_REQUEST", {msg:'非法的city,不存在',data:null,result:'failed'});
                    return
                }
            }
            if(typeof req.body.area !== 'undefined'){
                let p=await this.query('SELECT id FROM app_areas where areaid =?',{replacements:[req.body.area],type:this.QueryTypes.SELECT});
                if(p.length==0){
                    this.makeJSON(res, "BAD_REQUEST", {msg:'非法的area,不存在',data:null,result:'failed'});
                    return
                }
            }

            let password=(new Date()/1).toString();
            password=password.substring(password.length-8, password.length);
            let sql=`INSERT INTO sys_organization(\`name\`,\`province\`,\`city\`,\`area\`,\`address\`,password) VALUES(?,?,?,?,?,?);`;
            let p=await this.query(sql,{
                replacements:[req.body.name,req.body.province,req.body.city,req.body.area,req.body.address,password],
                type:this.QueryTypes.INSERT
            })
            this.makeJSON(res, "SUCCESS", {data:null,result:'success'});
        }catch (error){
            if(error.name && error.name=='SequelizeDatabaseError'){
                this.makeJSON(res, "DB_ERROR", {data:null,result:'failed'});
            }else{
                this.makeJSON(res, "SERVER_ERROR", {data:null,result:'failed'});
            }
            console.error('/organization/addOrg',error);
        }
    }
    /**
     * @api {POST} /organization/updateOrg 修改机构
     * @apiGroup Organization
     *
     * @apiParam {int} id   ID
     * @apiParam {string} [name]   名字
     * @apiParam {int} [province]  省份代码
     * @apiParam {int} [city]   同上
     * @apiParam {int} [area]    同上
     * @apiParam {string} [address] 详细地址
     *
     * @apiSuccessExample 返回结果:
     *  {
     *      "code": "0x000000",
     *      "msg": "操作成功！"
     *      "data":null
     *      msg:'操作成功',
     *      result:'success'
     *  }
     */
    async updateOrg(req,res){
        try {
            let org_user=this.util.getSession(req,'org_user');
            if(org_user.id!=1){
                this.makeJSON(res, "BAD_REQUEST", {msg:'用户无权限！',data:null,result:'failed'});
                return
            }
            let parameters=[
                ['id','number'],
                ['name','string',true],
                ['province','number',true],
                ['city','number',true],
                ['area','number',true],
                ['address','string',true]
            ];
            let checkParameters=this.checkParametersType(res,req.body,parameters);//检查参数是否齐全,以及类型是否正确
            if(!checkParameters){
                return;
            }
            let p1=await this.query('SELECT * FROM sys_organization AS b WHERE b.`id`=?',{
                replacements:[req.body.id],
                type:this.QueryTypes.SELECT
            })
            if(p1.length==0){
                this.makeJSON(res, "BAD_REQUEST", {msg:'非法的id,不存在',data:null,result:'failed'});
                return
            }
            let sql=`UPDATE sys_organization SET `;
            let updateReplacements=[];
            if(typeof req.body.name !== 'undefined'){
                updateReplacements.push(`\`name\`='${req.body.name}'`);
            }
            if(typeof req.body.province !== 'undefined'){
                let p=await this.query('SELECT id FROM app_provinces where provinceid =?',{replacements:[req.body.province],type:this.QueryTypes.SELECT});
                if(p.length==0){
                    this.makeJSON(res, "BAD_REQUEST", {msg:'非法的province,不存在',data:null,result:'failed'});
                    return
                }
                updateReplacements.push(`\`province\`='${req.body.province}'`);
            }
            if(typeof req.body.city !== 'undefined'){
                let p=await this.query('SELECT id FROM app_cities where cityid =?',{replacements:[req.body.city],type:this.QueryTypes.SELECT});
                if(p.length==0){
                    this.makeJSON(res, "BAD_REQUEST", {msg:'非法的city,不存在',data:null,result:'failed'});
                    return
                }
                updateReplacements.push(`\`city\`='${req.body.city}'`);
            }
            if(typeof req.body.area !== 'undefined'){
                let p=await this.query('SELECT id FROM app_areas where areaid =?',{replacements:[req.body.area],type:this.QueryTypes.SELECT});
                if(p.length==0){
                    this.makeJSON(res, "BAD_REQUEST", {msg:'非法的area,不存在',data:null,result:'failed'});
                    return
                }
                updateReplacements.push(`\`area\`='${req.body.area}'`);
            }
            if(typeof req.body.address !== 'undefined'){
                updateReplacements.push(`\`address\`='${req.body.address}'`);
            }
            if(updateReplacements.length!=0){
                let p=await this.query(sql+updateReplacements.join(',')+' WHERE id =?',{
                    replacements:[req.body.id],
                    type:this.QueryTypes.UPDATE
                })
            }
            this.makeJSON(res, "SUCCESS", {data:null,result:'success'});
        }catch (error) {
            if(error.name && error.name=='SequelizeDatabaseError'){
                this.makeJSON(res, "DB_ERROR", {data:null,result:'failed'});
            }else{
                this.makeJSON(res, "SERVER_ERROR", {data:null,result:'failed'});
            }
            console.error('/organization/updateOrg',error);
        }
    }
    /**
     * @api {POST} /organization/deleteOrg 删除机构
     * @apiGroup Organization
     *
     * @apiParam {int} id   ID
     *
     * @apiSuccessExample 返回结果:
     *  {
     *      "code": "0x000000",
     *      "msg": "操作成功！"
     *      "data":null
     *      msg:'操作成功',
     *      result:'success'
     *  }
     */
    async deleteOrg(req,res){
        try {
            let org_user=this.util.getSession(req,'org_user');
            if(org_user.id!=1){
                this.makeJSON(res, "BAD_REQUEST", {msg:'用户无权限！',data:null,result:'failed'});
                return
            }
            let parameters=[
                ['id','number'],
            ];
            let checkParameters=this.checkParametersType(res,req.body,parameters);//检查参数是否齐全,以及类型是否正确
            if(!checkParameters){
                return;
            }
            let p1=await this.query('SELECT * FROM sys_organization AS b WHERE b.`id`=? ',{
                replacements:[req.body.id],
                type:this.QueryTypes.SELECT
            });
            if(p1.length==0){
                this.makeJSON(res, "BAD_REQUEST", {msg:'非法ID，不存在',data:null,result:'failed'});
                return
            }
            let p2=await this.query('SELECT id FROM sys_org_school AS b WHERE b.`sys_org_id`=?',{
                replacements:[req.body.id],
                type:this.QueryTypes.SELECT
            })
            if(p2.length!=0){
                this.makeJSON(res, "BAD_REQUEST", {msg:'非法ID，机构被使用中',data:null,result:'failed'});
                return
            }
            let p=await this.query('DELETE FROM sys_organization WHERE id=?',{
                replacements:[req.body.id],
                type:this.QueryTypes.DELETE
            })
            this.makeJSON(res, "SUCCESS", {msg:'删除成功！',data:null,result:'success'});
        }catch (error) {
            if(error.name && error.name=='SequelizeDatabaseError'){
                this.makeJSON(res, "DB_ERROR", {data:null,result:'failed'});
            }else{
                this.makeJSON(res, "SERVER_ERROR", {data:null,result:'failed'});
            }
            console.error('/organization/deleteOrg',error);
        }
    }
    /**
     * @api {POST} /organization/getOrgPromoteResult  查询机构推广结果
     * @apiGroup Organization
     *
     * @apiSuccessExample 返回结果:
     * {
            "code": "0x000000",
            "msg": "查询成功",
            "result": "success",
            "data": {
                "org_info": {
                    "rank": 2, //排名
                    "id": 2,
                    "name": "测试机构2",
                    "province": "北京市",
                    "city": "市辖区",
                    "area": "东城区",
                    "user_num_1": 10, //下载体验
                    "user_num_2": 6, //后续使用
                    "user_num_3": 0, //累计发展小河长
                    "user_num_4": 0, //本月
                    "user_num_all": 16 // 1,2,3相加
                }
            }
        }
     *
     */
    async getOrgPromoteResult(req,res){
        try {
            let org_user=this.util.getSession(req,'org_user');
            let month=new Date().getMonth()+1;
            month=month<10?'0'+month.toString():month.toString();
            let year=new Date().getFullYear();
            let {nexYear,nexMonth}=this.util.getNextMonth(year,month);
            let nowDate=`${year}-${month}-01 00:00`;
            let nexDate=`${nexYear}-${nexMonth}-01 00:00`;
            let sql=`
                SELECT
                lr.*
                FROM (
                SELECT 
                @rowno:=@rowno + 1 AS rank,
                l.*
                FROM ( ${sql_promote}
                ORDER BY user_num_all DESC
                 ) AS l,
                (SELECT @rowno:=0) AS b
                ) AS lr
                WHERE lr.id=${org_user.id}
            `
            let p=await this.query(sql,{
                replacements:[nowDate,nexDate],
                type:this.QueryTypes.SELECT
            });
            let data=p[0] || null;
            this.makeJSON(res, "SUCCESS", {result: 'success', data:{org_info:data},msg:'查询成功'});
        }catch (error) {
            if(error.name && error.name=='SequelizeDatabaseError'){
                this.makeJSON(res, "DB_ERROR", {data:null,result:'failed'});
            }else{
                this.makeJSON(res, "SERVER_ERROR", {data:null,result:'failed'});
            }
            console.error('/organization/getOrgPromoteResult',error);
        }
    }
    /**
     * @api {POST} /organization/getOrgPromoteResultList  查询机构推广结果排行榜前十
     * @apiGroup Organization
     *
     * @apiSuccessExample 返回结果:
     * {
            "code": "0x000000",
            "msg": "查询成功",
            "result": "success",
            "data": {
                list:[
                        {
                            "id": 1,
                            "name": "测试机构1",
                            "province": "北京市",
                            "city": "市辖区",
                            "area": "东城区",
                            "user_num_1": 22,//下载体验人数
                            "user_num_2": 17,//后续使用人数
                            "user_num_3":1,//发展小河长累积数量
                            "user_num_4":1,//本月发展的小河长
                            "user_num_all": 40 //总和
                        },....
                    ],
            }
        }
     *
     */
    async getOrgPromoteResultList(req,res){
        try {
            let month=new Date().getMonth()+1;
            month=month<10?'0'+month.toString():month.toString();
            let year=new Date().getFullYear();
            let {nexYear,nexMonth}=this.util.getNextMonth(year,month);
            let nowDate=`${year}-${month}-01 00:00`;
            let nexDate=`${nexYear}-${nexMonth}-01 00:00`;
            let sql=`
            ${sql_promote}
            ORDER BY user_num_all DESC
            LIMIT ?,?
            `
            let p=await this.query(sql,{
                replacements:[nowDate,nexDate,0,10],
                type:this.QueryTypes.SELECT
            });
            this.makeJSON(res, "SUCCESS", {result: 'success', data:{list:p},msg:'查询成功'});
        }catch (error) {
            if(error.name && error.name=='SequelizeDatabaseError'){
                this.makeJSON(res, "DB_ERROR", {data:null,result:'failed'});
            }else{
                this.makeJSON(res, "SERVER_ERROR", {data:null,result:'failed'});
            }
            console.error('/organization/getOrgPromoteResultList',error);
        }
    }
    /**
     * @api {POST} /organization/getOrgPromoteResultListForManage  查询机构推广结果列表
     * @apiGroup Organization
     *
     * @apiParam {int} offset   从第几行开始，比如0表示从第一条开始，10表示从第11条开始
     * @apiParam {int} limit   获取多少条数据
     * @apiParam {string} [search]   按照名字进行搜索
     * @apiParam {string} [province]   按照省份进行搜索
     * @apiParam {int} [isFoul]   是否刷单 1刷单，2不刷单
     *
     * @apiSuccessExample 返回结果:
     * {
            "code": "0x000000",
            "msg": "查询成功",
            "result": "success",
            "data": {
                list:[
                        {
                            "id": 1,
                            "name": "测试机构1",
                            "province": "北京市",
                            "city": "市辖区",
                            "area": "东城区",
                            "user_num_1": 22,//下载体验人数
                            "user_num_2": 17,//后续使用人数
                            "user_num_3":1,//发展小河长累积数量
                            "user_num_4":1,//本月发展的小河长
                            "user_num_all": 40 //总和
                        },....
                    ],
            }
        }
     *
     */
    async getOrgPromoteResultListForManage(req,res){
        try {
            let org_user=this.util.getSession(req,'org_user');
            if(org_user.id!=1){
                this.makeJSON(res, "BAD_REQUEST", {msg:'用户无权限！',data:null,result:'failed'});
                return
            }
            let parameters=[
                ['offset','number'],//1-12
                ['limit','number'],
                ['search','string',true],
                ['province','string',true],
                ['isFoul','number',true]
            ];
            let checkParameters=this.checkParametersType(res,req.body,parameters);//检查参数是否齐全,以及类型是否正确
            if(!checkParameters){
                return;
            }
            let offset=Number(req.body.offset);
            let limit=Number(req.body.limit);

            let month=new Date().getMonth()+1;
            month=month<10?'0'+month.toString():month.toString();
            let year=new Date().getFullYear();
            let {nexYear,nexMonth}=this.util.getNextMonth(year,month);
            let nowDate=`${year}-${month}-01 00:00`;
            let nexDate=`${nexYear}-${nexMonth}-01 00:00`;
            let sql=`
                SELECT
                lr.*
                FROM (
                SELECT 
                @rowno:=@rowno + 1 AS rank,
                l.*
                FROM ( ${sql_promote}
                ORDER BY user_num_all DESC
                 ) AS l,
                (SELECT @rowno:=0) AS b
                ) AS lr
                WHERE 1=1
            `
            if(req.body.search){
                sql=sql+` AND lr.\`name\` LIKE '%${req.body.search }%' `
            }
            if(req.body.province){
                sql=sql+` AND lr.\`provinceid\` = '${req.body.province}' `
            }
            if(req.body.isFoul){
                sql=sql+` AND lr.\`isFoul\` = '${req.body.isFoul}' `
            }
            let sql2=`
            SELECT
            COUNT(*) AS total
            FROM ( ${sql} ) AS t`;
            sql=sql+`
                ORDER BY lr.rank
                LIMIT ?,?
            `
            let p=await this.query(sql,{
                replacements:[nowDate,nexDate,offset,limit],
                type:this.QueryTypes.SELECT
            });
            let total=await this.query(sql2,{
                replacements:[nowDate,nexDate],
                type:this.QueryTypes.SELECT
            });
            this.makeJSON(res, "SUCCESS", {result: 'success', data:p,...total[0],msg:'查询成功'});
        }catch (error) {
            if(error.name && error.name=='SequelizeDatabaseError'){
                this.makeJSON(res, "DB_ERROR", {data:null,result:'failed'});
            }else{
                this.makeJSON(res, "SERVER_ERROR", {data:null,result:'failed'});
            }
            console.error('/organization/getOrgPromoteResultListForManage',error);
        }
    }
    /**
     * @api {POST} /organization/getOrgRiverResultList  查询机构小河长活动结果列表
     * @apiGroup Organization
     *
     * @apiParam {int} month 月份1-12
     * @apiParam {int} year 年
     *
     * @apiSuccessExample 返回结果:
     * {
            "code": "0x000000",
            "msg": "查询成功",
            "result": "success",
            "data": {
                list:[
                    {
                        "id": 1,
                        "name": "测试机构1",
                        "user_num_all": 11, //总的小河长
                        "user_num_month": 11 //当月的小河长
                    },...
                ],
             }
        }
     *
     */
    async getOrgRiverResultList(req,res){
        try {
            let parameters=[
                ['month','number'],//1-12
                ['year','number']
            ];
            let checkParameters=this.checkParametersType(res,req.body,parameters);//检查参数是否齐全,以及类型是否正确
            if(!checkParameters){
                return;
            }
            let month=req.body.month<10?'0'+req.body.month.toString():req.body.month.toString();
            let year=req.body.year;
            let {nexYear,nexMonth}=this.util.getNextMonth(year,month);
            let sql=`
                SELECT 
                o.id,
                o.name,
                p.\`province\`,
                c.\`city\`,
                a.\`area\`,
                r1.user_num AS user_num_all,
                r2.user_num AS user_num_month
                FROM sys_organization AS o
                INNER JOIN(
                    SELECT m.sys_org_id,COUNT(d.id) AS user_num 
                    FROM sys_org_school AS m
                    LEFT JOIN (
                        SELECT 
                        u.\`id\`,
                        u.\`school_id\`
                        FROM app_user AS u
                        INNER JOIN app_score_gift_record AS l
                        ON l.\`app_user_id\`=u.\`id\`
                        AND l.\`app_gift_id\` = 10
                        GROUP BY u.\`id\`
                    ) AS d
                    ON m.\`app_school_id\`=d.\`school_id\`
                    GROUP BY m.\`sys_org_id\`
                ) AS r1
                ON o.\`id\`=r1.sys_org_id
                INNER JOIN(
                    SELECT m.sys_org_id,COUNT(d.id) AS user_num 
                    FROM sys_org_school AS m
                    LEFT JOIN (
                        SELECT 
                        u.\`id\`,
                        u.\`school_id\`
                        FROM app_user AS u
                        INNER JOIN app_score_gift_record AS l
                        ON l.\`app_user_id\`=u.\`id\`
                        AND l.\`app_gift_id\` = 10
                        AND l.\`create_time\`>='${year}-${month}-01 00:00'
                        AND l.\`create_time\`<'${nexYear}-${nexMonth}-01 00:00'
                        GROUP BY u.\`id\`
                    ) AS d
                    ON m.\`app_school_id\`=d.\`school_id\`
                    GROUP BY m.\`sys_org_id\`	
                ) AS r2
                ON o.\`id\`=r2.sys_org_id
                LEFT JOIN app_provinces AS p
                ON p.\`provinceid\`=o.\`province\`
                LEFT JOIN app_cities AS c
                ON c.\`cityid\`=o.\`city\`
                LEFT JOIN app_areas AS a
                ON a.\`areaid\`=o.\`area\`
                WHERE o.id > 1
                ORDER BY user_num_month DESC
                LIMIT 0,10`
            let p=await this.query(sql,{type:this.QueryTypes.SELECT});
            this.makeJSON(res, "SUCCESS", {result: 'success', data:{list:p},msg:'查询成功'});
        }catch (error) {
            if(error.name && error.name=='SequelizeDatabaseError'){
                this.makeJSON(res, "DB_ERROR", {data:null,result:'failed'});
            }else{
                this.makeJSON(res, "SERVER_ERROR", {data:null,result:'failed'});
            }
            console.error('/organization/getOrgRiverResultList',error);
        }
    }
    /**
     * @api {POST} /organization/updateRelationBetweenOAndS  修改机构与学校的关联
     * @apiGroup Organization
     *
     * @apiParam {JSON_string} relations [{schoolId:1,orgId:1}]
     *
     * @apiSuccessExample 返回结果:
     * {
            "code": "0x000000",
            "msg": "操作成功！",
            "data": null,
            "result": "success"
        }
     *
     */
    async updateRelationBetweenOAndS(req,res){
        try{
            let org_user=this.util.getSession(req,'org_user');
            if(org_user.id!=1){
                this.makeJSON(res, "BAD_REQUEST", {msg:'用户无权限！',data:null,result:'failed'});
                return
            }
            let parameters=[
                ['relations','JSON_string'],//需要修改的关联关系
            ];
            let checkParameters=this.checkParametersType(res,req.body,parameters);//检查参数是否齐全,以及类型是否正确
            if(!checkParameters){
                return;
            }
            let relations=JSON.parse(req.body.relations);
            for(let i=0;i<relations.length;i++){
                let {schoolId,orgId,schoolName}=relations[i];
                let p1 = await this.query(`SELECT id FROM app_school WHERE id = ?`,{replacements:[schoolId],type:this.QueryTypes.SELECT});
                if(p1.length==0){
                    this.makeJSON(res, "BAD_REQUEST", {msg:'不存在的学校'+schoolId,data:null,result:'failed'});
                    return
                }
                let p2 = await this.query(`SELECT id FROM sys_organization WHERE id = ?`,{replacements:[orgId],type:this.QueryTypes.SELECT});
                if(p2.length==0){
                    this.makeJSON(res, "BAD_REQUEST", {msg:'不存在的机构'+orgId,data:null,result:'failed'});
                    return
                }
                let p3 = await this.query('SELECT m.id,m.sys_org_id,o.name FROM sys_org_school AS m INNER JOIN sys_organization AS o ON o.id=m.sys_org_id WHERE app_school_id=?',{
                    replacements:[schoolId],
                    type:this.QueryTypes.SELECT
                })
                if(p3.length!=0 && p3[0].sys_org_id!=orgId){
                    this.makeJSON(res, "BAD_REQUEST", {msg:schoolName+'已经属于机构:'+p3[0].name,data:null,result:'failed'});
                    return
                }
            }
            await this.transaction(async t=>{
                for(let i=0;i<relations.length;i++){
                    let {schoolId,orgId}=relations[i];
                    let p3 = await this.query('SELECT id,sys_org_id FROM sys_org_school WHERE app_school_id=? AND sys_org_id=?',{
                        transaction:t,
                        replacements:[schoolId,orgId],
                        type:this.QueryTypes.SELECT
                    })
                    if(p3.length==0){
                        await this.query(`INSERT INTO sys_org_school(app_school_id,sys_org_id) VALUES(?,?)`,{
                            transaction:t,
                            replacements:[schoolId,orgId],
                            type:this.QueryTypes.INSERT
                        })
                    }
                }
            });
            this.makeJSON(res, "SUCCESS", {data:null,result:'success'});
        }catch (error) {
            if(error.name && error.name=='SequelizeDatabaseError'){
                this.makeJSON(res, "DB_ERROR", {data:null,result:'failed'});
            }else{
                this.makeJSON(res, "SERVER_ERROR", {data:null,result:'failed'});
            }
            console.error('/organization/getOrgRiverResultList',error);
        }
    }
    /**
     * @api {POST} /organization/deleteRelationBetweenOAndS  删除机构与学校的关联
     * @apiGroup Organization
     *
     * @apiParam {JSON_string} relations [{schoolId:1,orgId:1}]
     *
     * @apiSuccessExample 返回结果:
     * {
            "code": "0x000000",
            "msg": "操作成功！",
            "data": null,
            "result": "success"
        }
     *
     */
    async deleteRelationBetweenOAndS(req,res){
        try {
            let org_user=this.util.getSession(req,'org_user');
            if(org_user.id!=1){
                this.makeJSON(res, "BAD_REQUEST", {msg:'用户无权限！',data:null,result:'failed'});
                return
            }
            let parameters=[
                ['relations','JSON_string'],//需要删除的关联关系
            ];
            let checkParameters=this.checkParametersType(res,req.body,parameters);//检查参数是否齐全,以及类型是否正确
            if(!checkParameters){
                return;
            }
            let relations=JSON.parse(req.body.relations);
            for(let i=0;i<relations.length;i++){
                let {schoolId,orgId}=relations[i];
                let p3 = await this.query('SELECT id,sys_org_id FROM sys_org_school WHERE app_school_id=? AND sys_org_id=?',{
                    replacements:[schoolId,orgId],
                    type:this.QueryTypes.SELECT
                })
                if(p3.length==0){
                    this.makeJSON(res, "BAD_REQUEST", {msg:'不存在的关联'+orgId+'-'+schoolId,data:null,result:'failed'});
                    return
                }
            }
            await this.transaction(async t=>{
                for(let i=0;i<relations.length;i++){
                    let {schoolId,orgId}=relations[i];
                    await this.query(`DELETE FROM sys_org_school WHERE app_school_id=? AND sys_org_id=?`,{
                        replacements:[schoolId,orgId],
                        type:this.QueryTypes.DELETE,
                        transaction:t
                    })
                }
            });
            this.makeJSON(res, "SUCCESS", {msg:'删除成功！',data:null,result:'success'});
        }catch (error) {
            if(error.name && error.name=='SequelizeDatabaseError'){
                this.makeJSON(res, "DB_ERROR", {data:null,result:'failed'});
            }else{
                this.makeJSON(res, "SERVER_ERROR", {data:null,result:'failed'});
            }
            console.error('/organization/deleteOrg',error);
        }
    }
    /**
     * @api {POST} /organization/getSchoolListByOrg  查询机构的学校
     * @apiGroup Organization
     *
     * @apiParam {int} id 机构ID
     *
     * @apiSuccessExample 返回结果:
     * {
            "code": "0x000000",
            "msg": "操作成功！",
            "data": [
                {
                    "id": 592675,
                    "school_name": "北京光明小学本校区低年级部",
                    "school_no": null,
                    "school_img": null,
                    "province": "110000",
                    "city": "110100",
                    "area": "110101",
                    "address": "幸福巷与福光路交叉口西北100米",
                    "longitude": "116.432822",
                    "latitude": "39.886407",
                    "student_amount": null,
                    "shool_type": 1,
                    "create_date": "2018-08-10T10:30:08.000Z",
                    "update_date": "2018-08-10T10:30:08.000Z",
                    "flag": 0
                },...
            ],
            "result": "success"
        }
     *
     */
    async getSchoolListByOrg(req,res){
        try {
            let org_user=this.util.getSession(req,'org_user');
            if(org_user.id!=1){
                this.makeJSON(res, "BAD_REQUEST", {msg:'用户无权限！',data:null,result:'failed'});
                return
            }
            let parameters=[
                ['id','number'],
            ];
            let checkParameters=this.checkParametersType(res,req.body,parameters);//检查参数是否齐全,以及类型是否正确
            if(!checkParameters){
                return;
            }
            let p1=await this.query('SELECT * FROM sys_organization AS b WHERE b.`id`=? ',{
                replacements:[req.body.id],
                type:this.QueryTypes.SELECT
            });
            if(p1.length==0){
                this.makeJSON(res, "BAD_REQUEST", {msg:'非法ID，不存在',data:null,result:'failed'});
                return
            }
            let p = await this.query(`SELECT s.* FROM app_school AS s INNER JOIN sys_org_school AS m ON m.\`app_school_id\`=s.\`id\` AND m.\`sys_org_id\` = ?`,{
                replacements:[req.body.id],
                type:this.QueryTypes.SELECT
            });
            this.makeJSON(res, "SUCCESS", {msg:'查询成功！',data:p,result:'success'});
        }catch (error) {
            if(error.name && error.name=='SequelizeDatabaseError'){
                this.makeJSON(res, "DB_ERROR", {data:null,result:'failed'});
            }else{
                this.makeJSON(res, "SERVER_ERROR", {data:null,result:'failed'});
            }
            console.error('/organization/deleteOrg',error);
        }
    }
    /**
     * @api {POST} /organization/getAppUserByOrg  查询机构的app用户
     * @apiGroup Organization
     *
     * @apiParam {int} id 机构ID
     * @apiParam {int} offset   从第几行开始，比如0表示从第一条开始，10表示从第11条开始
     * @apiParam {int} limit   获取多少条数据
     * @apiParam {int} [havePhone]   有无手机号，1，有，2，没有
     * @apiParam {string} [province]   按照手机所属省份筛选，
     * @apiParam {int} [schoolId]   学校Id
     * @apiParam {int} [isAbnormal]   操作异常 1，异常，2无异常
     * @apiParam {int} [abnormalOrder]   操作时间排序 1，升序，2降序，默认排序1
     * @apiSuccessExample 返回结果:
     * {
            "code": "0x000000",
            "msg": "操作成功！",
            "data": [
                {
                    "id": 592675,
                    "school_name": "北京光明小学本校区低年级部",
                },...
            ],
            "result": "success"
        }
     *
     */
    async getAppUserByOrg(req,res){
        try {
            let org_user=this.util.getSession(req,'org_user');
            if(org_user.id!=1){
                this.makeJSON(res, "BAD_REQUEST", {msg:'用户无权限！',data:null,result:'failed'});
                return
            }
            let parameters=[
                ['id','number'],
                ['offset','number'],
                ['limit','number'],
                ['havePhone','number',true],
                ['province','string',true],
                ['schoolId','number',true],
                ['abnormalOrder','number',true]
            ];
            let checkParameters=this.checkParametersType(res,req.body,parameters);//检查参数是否齐全,以及类型是否正确
            if(!checkParameters){
                return;
            }
            const {offset,limit,havePhone,province,isAbnormal,schoolId,id,abnormalOrder}=req.body;
            let sql=`
                SELECT
                    u.\`id\`,
                    th.\`uid\`,
                    pro.\`province\`,
                    s.\`school_name\`,
                    c.\`year\`,
                    c.\`classes_no\`,
                    m.\`sys_org_id\`,
                    handle.ds_str
                FROM app_user AS u
                LEFT JOIN (
                    SELECT
                    th.\`uid\`,
                    th.\`app_user_id\`
                    FROM app_third_user AS th
                    WHERE th.\`app_type\`=1
                ) AS th
                ON th.\`app_user_id\`=u.\`id\`
                INNER JOIN app_school AS s
                ON u.\`school_id\`=s.\`id\`
                INNER JOIN app_school_classes AS sc
                ON sc.\`id\`=u.\`school_classes_id\`
                INNER JOIN app_classes AS c
                ON c.id=sc.\`app_classes_id\`
                INNER JOIN sys_org_school AS m
                ON u.\`school_id\`=m.\`app_school_id\`
                LEFT JOIN sys_phone AS phone
                ON phone.\`phone_num\`=th.\`uid\`
                LEFT JOIN app_provinces AS pro
                ON pro.\`provinceid\`=phone.\`province\`
                LEFT JOIN (
                    SELECT 
                    COUNT(r.id) AS err_num,
                    r.id,
                    r.school_id,
                    GROUP_CONCAT(DISTINCT r.ds ORDER BY r.ds ${abnormalOrder==2?'DESC':'ASC'}) AS ds_str
                    FROM (
                        SELECT
                        u.\`id\`,
                        u.\`school_id\`,
                        TIMESTAMPDIFF(SECOND,u.create_time,l.create_time) AS ds
                        FROM app_user AS u
                        LEFT JOIN app_handle_logs AS l
                        ON l.\`app_user_id\`=u.\`id\`
                        WHERE
                        l.\`app_handle_id\` IN (3,6)
                    ) AS r
                    GROUP BY r.id
                ) AS handle
                ON handle.id=u.\`id\`
            `
            let options=[];
            if(id){
                options.push('m.`sys_org_id`='+id);
            }
            if(havePhone && havePhone==1){
                options.push('th.uid IS NOT NULL');
            }
            if(havePhone && havePhone==2){
                options.push('th.uid IS NULL');
            }
            if(province){
                options.push(`pro.\`provinceid\`='${province}'`);
            }
            if(isAbnormal){
                let _s=`
                    SELECT
                    m.\`id\`
                    FROM (
                    SELECT 
                    COUNT(r.id) AS err_num,
                    r.id,
                    r.school_id,
                    GROUP_CONCAT(DISTINCT r.ds ORDER BY r.ds DESC) AS ds_str
                    FROM (
                        SELECT
                        u.\`id\`,
                        u.\`school_id\`,
                        TIMESTAMPDIFF(SECOND,u.create_time,l.create_time) AS ds
                        FROM app_user AS u
                        LEFT JOIN app_handle_logs AS l
                        ON l.\`app_user_id\`=u.\`id\`
                        WHERE
                        l.\`app_handle_id\` IN (3,6)
                    ) AS r
                    WHERE r.ds<90
                    GROUP BY r.id
                    ) AS m
                    WHERE m.err_num>2
                `
                if(isAbnormal==1){
                    options.push(`u.\`id\` IN ( ${_s} )`);
                }else{
                    options.push(`u.\`id\` NOT IN ( ${_s} )`);
                }
            }
            if(schoolId){
                options.push(`u.\`school_id\`=${schoolId}`);
            }
            let options_str='';
            if(options.length!=0){
                options_str='WHERE '+options.join(' AND ');
            }
            let p=await this.query(sql+options_str+' LIMIT ?,?',{
                replacements:[Number(offset),Number(limit)],
                type:this.QueryTypes.SELECT
            })
            let p2=await this.query(`SELECT COUNT(*) AS total FROM ( ${sql+options_str} ) AS c`,{type:this.QueryTypes.SELECT})
            this.makeJSON(res, "SUCCESS", {msg:'查询成功！',data:p,...p2[0],result:'success'});
        }catch (error) {
            if(error.name && error.name=='SequelizeDatabaseError'){
                this.makeJSON(res, "DB_ERROR", {data:null,result:'failed'});
            }else{
                this.makeJSON(res, "SERVER_ERROR", {data:null,result:'failed'});
            }
            console.error('/organization/getAppUserByOrg',error);
        }
    }
    /**
     * @api {POST} /organization/getSchoolDataByOrg  查询机构的学校数据
     * @apiGroup Organization
     *
     * @apiParam {int} id 机构ID
     * @apiParam {int} offset   从第几行开始，比如0表示从第一条开始，10表示从第11条开始
     * @apiParam {int} limit   获取多少条数据
     * @apiSuccessExample 返回结果:
     * {
            "code": "0x000000",
            "msg": "操作成功！",
            "data": [
                {
                },...
            ],
            "result": "success"
        }
     *
     */
    async getSchoolDataByOrg(req,res){
        try {
            let org_user=this.util.getSession(req,'org_user');
            if(org_user.id!=1){
                this.makeJSON(res, "BAD_REQUEST", {msg:'用户无权限！',data:null,result:'failed'});
                return
            }
            let parameters=[
                ['id','number'],
                ['offset','number'],
                ['limit','number'],
            ];
            let checkParameters=this.checkParametersType(res,req.body,parameters);//检查参数是否齐全,以及类型是否正确
            if(!checkParameters){
                return;
            }
            const {id,offset,limit}=req.body;
            let sql=`
                SELECT
                    sch.id,
                    sch.\`school_name\`,
                    pro.province,
                    r1.total AS user_num1,
                    r2.total AS user_num2,
                    r3.total AS user_num3,
                    r1.total + r2.total+r3.total AS all_user_num
                FROM app_school AS sch
                INNER JOIN app_provinces AS pro
                ON pro.provinceid=sch.province
                INNER JOIN sys_org_school AS m
                ON sch.\`id\`=m.\`app_school_id\`
                LEFT JOIN (
                    SELECT 
                    COUNT(u.\`id\`) total,
                    u.\`school_id\`
                    FROM app_user AS u
                    INNER JOIN river_score AS s
                    ON u.\`id\`=s.\`app_user_id\`
                    WHERE s.\`is_answer\`=1
                    GROUP BY u.\`school_id\`
                ) AS r1
                ON r1.school_id=sch.\`id\`
                LEFT JOIN (
                    SELECT
                    COUNT(g.id) total,
                    g.school_id
                    FROM (
                    SELECT
                    u.\`id\`,
                    u.\`school_id\`,
                    COUNT(l.\`id\`) AS total
                    FROM app_user AS u
                    LEFT JOIN app_handle_logs AS l
                    ON l.\`app_user_id\`=u.\`id\`
                    AND l.\`app_handle_id\` IN (3,6)
                    GROUP BY u.\`id\`
                    ) AS g
                    WHERE g.total>2
                    GROUP BY g.school_id
                ) AS r2
                ON r2.school_id=sch.\`id\`
                LEFT JOIN (
                    SELECT 
                    COUNT(u.\`id\`) total,
                    u.\`school_id\`
                    FROM app_user AS u
                    INNER JOIN app_score_gift_record AS l
                    ON l.\`app_user_id\`=u.\`id\`
                    AND l.\`app_gift_id\` = 10
                    GROUP BY u.school_id
                ) AS r3
                ON r3.school_id=sch.\`id\`
                WHERE m.\`sys_org_id\`=?
                ORDER BY all_user_num DESC
                LIMIT ?,?
            `
            let p=await this.query(sql,{
                replacements:[Number(id),Number(offset),Number(limit)],
                type:this.QueryTypes.SELECT
            });
            let p2=await this.query(`SELECT COUNT(*) AS total FROM ( ${sql} ) AS c`,{
                replacements:[Number(id),Number(offset),Number(limit)],
                type:this.QueryTypes.SELECT
            })
            this.makeJSON(res, "SUCCESS", {msg:'查询成功！',data:p,...p2[0],result:'success'});
        }catch (error) {
            if(error.name && error.name=='SequelizeDatabaseError'){
                this.makeJSON(res, "DB_ERROR", {data:null,result:'failed'});
            }else{
                this.makeJSON(res, "SERVER_ERROR", {data:null,result:'failed'});
            }
            console.error('/organization/getSchoolDataByOrg',error);
        }
    }
    /**
     * @api {POST} /organization/login  机构登录
     * @apiGroup Organization
     *
     * @apiParam {string} account 账号
     * @apiParam {string} password 密码
     *
     * @apiSuccessExample 返回结果:
     * {
            "code": "0x000000",
            "msg": "操作成功！",
            "data": null,
            "result": "success"
        }
     *
     */
    async login(req,res){
        try {
            let parameters=[
                ['account','string'],
                ['password','string'],
            ];
            let checkParameters=this.checkParametersType(res,req.body,parameters);//检查参数是否齐全,以及类型是否正确
            if(!checkParameters){
                return;
            }
            let p=await this.query('SELECT id,name FROM sys_organization WHERE id=? AND password=?',{
                type:this.QueryTypes.SELECT,
                replacements:[req.body.account,req.body.password]
            })
            if(p.length==0){
                this.makeJSON(res, "BAD_REQUEST", {msg:'登录失败！账号或密码错误',data:null,result:'failed'});
                return
            }
            this.util.setSession(req, "org_user", {id:p[0].id});
            this.makeJSON(res, "SUCCESS", {msg:'登录成功！',data:p[0],result:'success'});
        }catch (error) {
            if(error.name && error.name=='SequelizeDatabaseError'){
                this.makeJSON(res, "DB_ERROR", {data:null,result:'failed'});
            }else{
                this.makeJSON(res, "SERVER_ERROR", {data:null,result:'failed'});
            }
            console.error('/organization/login',error);
        }
    }
    /**
     * @api {POST} /organization/loginOut  机构退出登录
     * @apiGroup Organization
     *
     * @apiSuccessExample 返回结果:
     * {
            "code": "0x000000",
            "msg": "操作成功！",
            "data": null,
            "result": "success"
        }
     *
     */
    async loginOut(req,res){
        try {
            req.session.destroy();
            this.makeJSON(res, "SUCCESS", {result: 'success', data:null,msg:'退出成功'});
        }catch (error) {
            if(error.name && error.name=='SequelizeDatabaseError'){
                this.makeJSON(res, "DB_ERROR", {data:null,result:'failed'});
            }else{
                this.makeJSON(res, "SERVER_ERROR", {data:null,result:'failed'});
            }
            console.error('/organization/login',error);
        }
    }
}