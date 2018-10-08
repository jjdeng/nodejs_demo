/**
 * @apiDefine  School 学校班级相关接口
 */
const  BaseDal = require('./BaseDal');
const SCHOOL_TYPE = require('../smart/ConstantUtils').SCHOOL_TYPE;
module.exports = class SysSchoolDal extends  BaseDal{
    /**
     * @api {POST} /school/actionSchool *学校查询新增修改删除
     * @apiGroup School
     * @apiParam {int} operateType 0 :查询分页 1:新增 2 :修改() 3: 删除 4:查询（用与学校校下拉框）不带分页
     * @apiParam {string} id 用户id  //删除 修改 必须
     * @apiParam {Array}  school_type 学校类型   如：[1,2,3]//1 一般学校 2 重点学校  3 活动学校
     * @apiParam {string} school_name 账号
     * @apiParam {string} provinceid 省份代码
     * @apiParam {string} cityid　城市代码
     * @apiParam {string} areaid 区县代码
     * @apiParam {string} address 学校地址　
     * @apiParam {string} longitude 经度
     * @apiParam {string} latitude 纬度
     * @apiParam {int} pageIndex 页数 //分页查询使用
     * @apiParam {int} pageCount  每页数量//分页查询使用
     * @apiSuccessExample 返回结果:
     *  {
     *      "code": "0x000000", //
     *      "msg": "操作成功！"
     *      "data": {}
     *  }
     *
     */
    async actionSchool(req, res){
        let operateType = req.body.operateType;
        let school_type = req.body.school_type;
        if( !this.util.isEmpty(school_type)&& !this.util.isArray(school_type)){
            this.makeJSON(res,'BAD_REQUEST',{result:'failed',data:null,msg:'请求错误，school_type不是一个数组！'});
            return;
        }
        let school = await  this.getSchool(req);
        console.log(school);
        //查询
        if(operateType==0){
            this.makeJSON(res, "SUCCESS", {result: 'success', data:await  this.getSchoolPages(school,res),msg:'查询成功'});
        }else if(operateType==1){//新增
            this.makeJSON(res, "SUCCESS", {result: 'success', data:await this.addSchool(school, res),msg:'添加成功'});
        }else if(operateType==2){//更新
            this.makeJSON(res, "SUCCESS", {result: 'success', data: await this.updateSchool(school,res),msg:'更新成功！'});
        }else if (operateType==3){//删除
            this.makeJSON(res, "SUCCESS", {result: 'success',data: await this.deleteSchool(school,res),msg:'删除成功！'});
        }else if (operateType==4){//查询 不分页 就学校id 和名称
            this.makeJSON(res, "SUCCESS", {result: 'success', data:await  this.getSchoolList(school,res),msg:'查询成功'});
        }else{
            this.makeJSON(res,'BAD_REQUEST',{result:'failed',data:null,msg:'请求错误，不存在该请求！'});
        }
    }
    /**
     * 创建学校班级
     * @param school_id
     * @returns {Promise<Array>}
     */
    async makeClassList(school_id){
        let classesList  = [];
        let year = new Date().getFullYear();
        for(let y = 0;y <= 5; y++){
            for(let j = 1;j <=30;j++){
                let classes  = {};
                classes.app_school_id = school_id;
                classes.year = year-y;
                classes.classes_no = j;
                classesList.push(classes);
            }
        }
        return classesList;
    }

    getIdArray(array){
        let ids =  [];
        for (let i = 0; i < array.length; i++) {
            ids.push(array[i].id);
        }
        return ids
    }
    /**
     * 根据学校ids获取对应类型
     * @param school_ids
     * @returns {Promise<*>}
     */
    async getSchoolTypeSclIds(school_ids){
        let sql = `SELECT school_id,school_type FROM  app_school_type WHERE school_id in(:school_ids) ORDER BY school_id DESC`;
        let schoolTypeList = await this.query(sql,{replacements:{school_ids:school_ids},type:this.QueryTypes.SELECT});
        if(schoolTypeList==null||schoolTypeList.length<=0){
            return null;
        }
        return schoolTypeList;
    }
    async getSchoolPages(school,res){
        console.log('获取学校列表（分页）');
        try {
            let sql  =`SELECT sc.id,
                sc.school_name,
                sc.address,
                sc.longitude,
                sc.latitude,
                p.provinceid,
                p.province,
                c.cityid,
                c.city,
                a.areaid,
                a.area 
            FROM xxy_db.app_school  sc
             LEFT JOIN xxy_db.app_provinces p ON p.provinceid = sc.province
             LEFT JOIN xxy_db.app_cities c ON c.cityid = sc.city
             LEFT JOIN xxy_db.app_areas  a ON a.areaid = sc.area
             WHERE`;
            let sqlcount  = 'SELECT count(id) as count FROM xxy_db.app_school sc  WHERE   ';
            let params = await this.getParamteSchool(school);
            let parameters = params.parameters;
            parameters.push((school.pageIndex-1)*school.pageCount);
            parameters.push(school.pageCount);
            let schoolList =await this.query(sql+params.whereSql+' ORDER BY  sc.id DESC  limit ?,? ',{replacements:parameters,type:this.QueryTypes.SELECT});
            let count =await this.query(sqlcount+params.whereSql,{replacements:parameters,type:this.QueryTypes.SELECT});
            //根据学校ids查询学校类型，并遍历赋值。
            if(schoolList!=null && schoolList.length>0){
                let ids =  this.getIdArray(schoolList)
                let school_types =await this.getSchoolTypeSclIds(ids);
                if(school_types!=null && school_types.length>0){
                    for (let i = 0; i < schoolList.length; i++) {
                        let typeStr ='';
                        for (let j = 0; j < school_types.length; j++) {
                            if(school_types[j].school_id ==schoolList[i].id ){
                                typeStr = typeStr+SCHOOL_TYPE.get(school_types[j].school_type)+'|'
                            }
                        }
                        schoolList[i].school_type = typeStr.substring(0,typeStr.length-1);
                    }
                }
            }
            return {'count':count[0].count,'schoolList':schoolList};
        }catch (error) {
            this.makeJSON(res, "DB_ERROR", {data: null, result: 'failed'});
            console.error('router:/school/getSchoolPages');
            console.log(error);
        }
    }
    async getSchoolList(school,res){
        console.log('获取学校列表（不分页）');
        try {
            let sql  = 'SELECT sc.id,sc.school_name FROM xxy_db.app_school sc WHERE';
            let params = await this.getParamteSchool(school);
            let parameters = params.parameters;
            let schoolList =await this.query(sql+params.whereSql,{replacements:parameters,type:this.QueryTypes.SELECT});
            return schoolList;
        }catch (error) {
            this.makeJSON(res, "DB_ERROR", {data: null, result: 'failed'});
            console.error('router:/school/getSchools');
            console.log(error);
        }   nsole.log(error);

    }
    async addSchool(school,res){
        console.log('添加学校');
        try {
            if(this.util.isEmpty(school.province)||this.util.isEmpty(school.city)||this.util.isEmpty(school.area)){
                this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'地区必须包含省市区！'});
                return;
            }
            if(this.util.isEmpty(school.school_name)){
                this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'！'});
                return;
            }
            let isexsitSchool =await this.getSchoolList({school_name:this.util.getTrimedStr(school.school_name),area:school.area});
            if(isexsitSchool!=null && isexsitSchool.length > 0){
                this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'你添加的学校已经存在'});
                return;
            }
            let intScSql = 'INSERT INTO xxy_db.app_school(school_name,province,city,area,address,longitude,latitude) VALUES(?,?,?,?,?,?,?)';
            let intTySql = 'INSERT INTO xxy_db.app_school_type(school_id,school_type) VALUES(?,?)';
            await this.transaction(async t=>{
                let addSchool = await this.query(intScSql,
                    {
                        replacements: [
                            school.school_name,
                            school.province,
                            school.city,
                            school.area,
                            school.address,
                            school.longitude,
                            school.latitude],
                        transaction:t,
                        type: this.QueryTypes.INSERT
                    });
                let school_type = school.school_type;
                if(school_type!=null && school_type.length>0 && addSchool[1] > 0){
                    for (let i = 0; i <  school_type.length; i++) {
                         await this.query(intTySql,
                            {
                                replacements: [
                                    addSchool[0],
                                    parseInt(school_type[i])],
                                transaction:t,
                                type: this.QueryTypes.INSERT
                            });
                    }
                }
                school.id = addSchool[0];
                console.log(addSchool);
            });

            return school;
        }catch (error) {
            this.makeJSON(res, "DB_ERROR", {data: null, result: 'failed'});
            console.error('router:/school/addSchool');
            console.log(error);
        }
    }
    async updateSchool(school,res){
        console.log('修改学校学数据');
        console.log();
        try {
            let school_type = school.school_type;
            if(this.util.isEmpty(school.id)||!this.util.stringIsNumber(school.id)){
                this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'学校id为空或非法！'});
                return;
            }
            let setSql = 'set';
            let params = [];
            if(!this.util.isEmpty(school.school_name)){
                setSql =setSql+ '  school_name = ?,';
                params.push(this.util.getTrimedStr(school.school_name));
            }
            if(!this.util.isEmpty(school.province)){
                setSql =setSql+ '  province = ?,';
                params.push(school.province);
            }
            if(!this.util.isEmpty(school.city)){
                setSql = setSql+'  city = ?,';
                params.push(school.city);
            }
            if(!this.util.isEmpty(school.area)){
                setSql = setSql+'  area = ?,';
                params.push(school.area);
            }
            if(!this.util.isEmpty(school.address)){
                setSql = setSql+'  address = ?,';
                params.push(school.address);
            }
            if(!this.util.isEmpty(school.longitude)){
                setSql = setSql+'  longitude = ?,';
                params.push(school.longitude);
            }
            if(!this.util.isEmpty(school.latitude)){
                setSql = setSql+'  latitude = ?,';
                params.push(school.latitude);
            }
            if(setSql=='set'&& (this.util.isEmpty(school_type) || school_type.length<=0)){
                this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'传入的参数全为空！'});
                return;
            }
            params.push(school.id);
            console.log(params);
            let updateSql='update xxy_db.app_school '+ setSql.substring(0,setSql.length-1)+'  WHERE id = ?';
            let delTySql='DELETE FROM  app_school_type WHERE  school_id = ?';
            let intTySql = 'INSERT INTO xxy_db.app_school_type(school_id,school_type) VALUES(?,?)';
            await this.transaction(async t=>{
                if(setSql!='set'){
                    let delUser =await this.query(updateSql,{replacements:params,type:this.QueryTypes.UPDATE});
                }
                if(school_type!=null && school_type.length>0 ){
                    //删除已有的类型
                    let delUser =await this.query(delTySql,{replacements:[school.id],type:this.QueryTypes.UPDATE});
                    //添加新的类型
                    for (let i = 0; i <  school_type.length; i++) {
                        await this.query(intTySql,
                            {
                                replacements: [
                                    [school.id],
                                    parseInt(school_type[i])],
                                transaction:t,
                                type: this.QueryTypes.INSERT
                            });
                    }
                }
            });
            return {isSuccess:true};
        }catch (error) {
            this.makeJSON(res, "DB_ERROR", {data: null, result: 'failed'});
            console.error('router:/school/updateSchool');
            console.log(error);
        }
    }
    async deleteSchool(school,res){
        console.log('删除学校数据');
        try {
            if(this.util.isEmpty(school.id)){
                this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'学校id不能为空！'});
                return;
            }
            if(await this.isExistUser(school.id)){
                this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'学校存在用户，不能删除！'});
                return;
            }
            let delScSql='DELETE FROM  app_school WHERE id = ?';
            let delTySql='DELETE FROM  app_school_type WHERE  school_id = ?';
            await this.transaction(async t=>{
                await this.query(delScSql,{replacements:[school.id],transaction: t,type:this.QueryTypes.DELETE});
                await this.query(delTySql,{replacements:[school.id],transaction: t,type:this.QueryTypes.DELETE});
            });
            return {isSuccess:true};
        }catch (error) {
            this.makeJSON(res, "DB_ERROR", {data: null, result: 'failed'});
            console.error('router:/school/deleteSchool');
            console.log(error);
        }
    }
    async isExistUser(school_id){
        let sql = 'SELECT count(id) as count FROM xxy_db.app_user where school_id = ? ';
        let count =await this.query(sql,{replacements:[school_id],type:this.QueryTypes.SELECT});
        console.log(count);
        return count[0].count>0;
    }
    async getSchool(req){
        return {
            'id':parseInt(req.body.id),
            'school_name':req.body.school_name,
            'province':req.body.provinceid||'',
            'city':req.body.cityid||'',
            'area':req.body.areaid||'',
            'address':req.body.address||'',
            'longitude':req.body.longitude||'',
            'latitude':req.body.latitude||'',
            'school_type':req.body.school_type||null,
            'pageIndex':parseInt(req.body.pageIndex)||1,
            'pageCount':parseInt(req.body.pageCount)||30
        }
    }
    /**
     *
     * @param user
     * @returns {'parameters':[],whereSql:'and name = zhans  and account= qwerrtt'}
     */
    async getParamteSchool(school){
        // let result={'parameters':[],whereSql:''};
        let parameters = [];
        let whereSql = ' 1=1 ';
        if(!this.util.isEmpty(school.school_name)){
            whereSql =whereSql+ ' and sc.school_name like ? ';
            parameters.push('%'+this.util.getTrimedStr(school.school_name)+'%');
        }
        if(!this.util.isEmpty(school.id)&&this.util.stringIsNumber(school.id)){
            whereSql = whereSql+' and sc.id = ?';
            parameters.push(school.id);
        }
        if(!this.util.isEmpty(school.area)){
            whereSql = whereSql+' and sc.area = ?';
            parameters.push(school.area);
        }else if(!this.util.isEmpty(school.city)){
            whereSql = whereSql+' and sc.city = ? ';
            parameters.push(school.city);
        }else if(!this.util.isEmpty(school.province)){
            whereSql =whereSql+ ' and sc.province = ? ';
            parameters.push(school.province);
        }
        console.log(whereSql);
        return {'parameters':parameters,'whereSql':whereSql};
    }
};