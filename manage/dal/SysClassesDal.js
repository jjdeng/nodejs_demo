const  BaseDal = require('./BaseDal');
module.exports = class SysClassesDal extends  BaseDal{
    /**
     * @api {POST} /classes/actionClasses *班级查询新增修改删除
     * @apiGroup School
     * @apiParam {int} operateType 0 :查询分页 1:新增 2 :修改() 3: 删除
     * @apiParam {string} id 班级id  //删除 修改 必须
     * @apiParam {int} app_school_id 学校id
     * @apiParam {int} app_classes_id  年级
     * @apiParam {int} classes_name 班号　
     * @apiParam {int} student_amount 人数
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
    async actionClasses(req, res){
        let operateType = req.body.operateType;
        let clazz = await  this.getClazz(req);
        console.log(operateType);
        console.log(clazz);
        //查询
        if(operateType==0){
            this.makeJSON(res, "SUCCESS", {result: 'success', data:await  this.getClazzPages(clazz,res),msg:'查询成功'});
        }else if(operateType==1){//新增
            this.makeJSON(res, "SUCCESS", {result: 'success', data:await this.addClazz(clazz, res),msg:'添加成功'});
        }else if(operateType==2){//更新
            this.makeJSON(res, "SUCCESS", {result: 'success', data: await this.updateClazz(clazz,res),msg:'更新成功！'});
        }else if (operateType==3){//删除
            this.makeJSON(res, "SUCCESS", {result: 'success',data: await this.deleteClazz(clazz,res),msg:'删除成功！'});
        }else{
            this.makeJSON(res,'BAD_REQUEST',{result:'failed',data:null,msg:'请求错误，不存在该请求！'});
        }
    }
    async getClazzPages(clazz,res){
        console.log('查询班级数据（分页）');
        try {
            let sql  = 'SELECT app_school_classes.id,' +
                            'app_school_classes.classes_name,' +
                            'app_school_classes.app_shcool_id,' +
                            'app_classes.`year`,' +
                            'app_classes.classes_no,' +
                            'app_school_classes.student_amount' +
                    ' FROM app_school_classes ' +
                    ' INNER JOIN app_classes  ON app_classes.id = app_school_classes.app_classes_id WHERE ';
            let sqlcount  = 'SELECT count(id) as count FROM app_school_classes   WHERE ';
            let params = await this.getParamteClasses(clazz);
            let parameters = params.parameters;
            parameters.push((clazz.pageIndex-1)*clazz.pageCount);
            parameters.push(clazz.pageCount);
            let clazzList =await this.query(sql+params.whereSql+'ORDER BY year ASC limit ?,? ',{replacements:parameters,type:this.QueryTypes.SELECT});
            let count =await this.query(sqlcount+params.whereSql,{replacements:parameters,type:this.QueryTypes.SELECT});
            return {'count':count[0].count,'clazzList':clazzList};
        }catch (error) {
            this.makeJSON(res, "DB_ERROR", {data: null, result: 'failed'});
            console.error('router:/classes/getClassPages');
            console.log(error);
        }
    }
    async getClazzList(clazz,res){
        console.log('获取班级数据（不分页）');
        try {
            let sql  = 'SELECT app_school_classes.id,' +
                'app_school_classes.classes_name,' +
                'app_school_classes.app_shcool_id,' +
                'app_classes.`year`,' +
                'app_classes.classes_no,' +
                'app_school_classes.student_amount' +
                ' FROM app_school_classes ' +
                ' INNER JOIN app_classes  ON app_classes.id = app_school_classes.app_classes_id WHERE ';
            let params = await this.getParamteClasses(clazz);
            let parameters = params.parameters;
            let clazzList =await this.query(sql+params.whereSql,{replacements:parameters,type:this.QueryTypes.SELECT});
            let count =await this.query(countSql+params.whereSql,{replacements:parameters,type:this.QueryTypes.SELECT});
            return clazzList;
        }catch (error) {
            this.makeJSON(res, "DB_ERROR", {data: null, result: 'failed'});
            console.error('router:/classes/getClazzList');
            console.log(error);
        }   nsole.log(error);

    }

    /**
     * @api {POST} /classes/getYearClazzs  获取年级和班级信息
     * @apiGroup School
     * @apiParam {int} school_id  学校id
     * @apiSuccessExample 返回结果:
     *  {
         *      "code": "0x000000",
         *      "msg": "操作成功！",
         *      data[
         *
         *]
         *  }
     */
    async getYearClazzs(req, res){
        try {
            let school_id = req.body.school_id;
            let user = this.getUserSessionInfo(req);
            if(school_id==null || this.util.isEmpty(school_id)){
                this.makeJSON(res, "BAD_REQUEST", {data:[{isSuccess:true}],result:'failed',msg:'学校id不能为空！'});
                return;
            }
            let selsql = ' SELECT app_school_classes.id ,app_classes.year,app_classes.classes_no FROM app_school_classes ' +
                ' INNER JOIN app_classes  ON app_classes.id = app_school_classes.app_classes_id WHERE app_school_classes.app_shcool_id = ?';//
            let selsql2 = 'SELECT  DISTINCT year FROM  app_classes  ORDER BY year ASC';
            let classesNo = await this.query(selsql,{replacements:[school_id],type:this.QueryTypes.SELECT});
            let classesLevel = await this.query(selsql2,{type:this.QueryTypes.SELECT});
            //console.log(classesNo);
            //console.log(classesLevel);
            let data = [];
            if(classesLevel==null||classesLevel.length<=0){
                this.makeJSON(res, "OTHER_ERROR", {data:[{isSuccess:true}],result:'failed',msg:'该学校没有创建年级信息！'});
                return;
            }
            for(let i = 0;i < classesLevel.length ; i++){
                let classArr = {};
                let values = [];
                let key = classesLevel[i].year;
                for(let j = 0;j < classesNo.length ; j++){
                    if(key==classesNo[j].year){
                        let valuesObject ={};
                        valuesObject.classes_id = classesNo[j].id;
                        valuesObject.classes_no = classesNo[j].classes_no;
                        values.push(valuesObject);
                    }
                }
                if(values.length>0){
                    classArr.year =key ;
                    classArr.classes_no = values;
                    data.push(classArr);
                }

            }
            //console.log(data);
            this.makeJSON(res, "SUCCESS", {data:data,result:'success'});
        }catch (error) {
            this.makeJSON(res, "DB_ERROR", {data: null, result: 'failed'});
            console.error('router:/user/getClasses');
            console.error(error);
        }
    }
    async addClazz(clazz,res){
        console.log('添加班级数据');
        try {
            if(this.util.isEmpty(clazz.app_school_id)||!this.util.stringIsNumber(clazz.app_school_id)){
                this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'学校id为空或非法！'});
                return;
            }
            if(this.util.isEmpty(clazz.app_classes_id)||!this.util.stringIsNumber(clazz.app_classes_id)){
                this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'年级app_classes_id为空或非法！'});
                return;
            }
            if(this.util.isEmpty(clazz.app_school_id)||!this.util.stringIsNumber(clazz.app_school_id)){
                this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'班号classes_no为空或非法！'});
                return;
            }
            if(this.util.isEmpty(clazz.student_amount)||!this.util.stringIsNumber(clazz.student_amount)){
                this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'人数student_amount为空或非法！'});
                return;
            }
            let intClsSql = 'INSERT INTO app_school_classes (app_shcool_id,app_classes_id,student_amount,classes_name) VALUES(?,?,?,?)';
            let te;
            if(!await this.isExsitClasses(clazz.app_school_id,clazz.app_classes_id)){
                 te= await this.query(intClsSql,{replacements: [clazz.app_school_id,clazz.app_classes_id,clazz.student_amount||0,clazz.classes_name||''],type: this.QueryTypes.INSERT });
                 console.log("添加班级："+te[0])
                clazz.id = te[0];
            }
            return clazz;
        }catch (error) {
            this.makeJSON(res, "DB_ERROR", {data: null, result: 'failed'});
            console.error('router:/school/addClazz');
            console.log(error);
        }
    }
    /*
           学校(id)是否存在该班级（id）不存在就新增一条
     */
    async isExsitClasses(school_id,classes_id){
        let id=0;
        let classes_school = 'SELECT count(id) as count FROM app_school_classes WHERE  app_shcool_id = ? and app_classes_id= ?';
        let obj = await this.query(classes_school,{replacements:[school_id,classes_id],type:this.QueryTypes.SELECT});
        return obj[0].count>0;
    }
    async updateClazz(clazz,res){
        console.log('更新班级数据');
        try {
            if(this.util.isEmpty(clazz.id)||!this.util.stringIsNumber(clazz.id)){
                this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'班级id为空或非法！'});
                return;
            }
            let setSql = 'set';
            let params = [];
            if(!this.util.isEmpty(clazz.app_classes_id)){
                setSql =setSql+ '  app_classes_id = ?,';
                params.push(clazz.app_classes_id);
            }
            if(!this.util.isEmpty(clazz.classes_name)){
                setSql =setSql+ '  classes_name = ?,';
                params.push(clazz.classes_name);
            }
            if(!this.util.isEmpty(clazz.student_amount)){
                setSql = setSql+'  student_amount = ?,';
                params.push(clazz.student_amount);
            }
            if(setSql=='set'){
                this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'传入的参数全为空！'});
                return;
            }
            params.push(clazz.id);
            console.log(params);
            let updateSql='update app_school_classes '+ setSql.substring(0,setSql.length-1)+'  WHERE id = ?';
            let delUser =await this.query(updateSql,{replacements:params,type:this.QueryTypes.UPDATE});
            return {isSuccess:true};
        }catch (error) {
            this.makeJSON(res, "DB_ERROR", {data: null, result: 'failed'});
            console.error('router:/classes/updateSchool');
            console.log(error);
        }
    }
    async deleteClazz(classes,res){
        console.log('删除班级数据');
        try {
            if(this.util.isEmpty(classes.id)){
                this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'学校id不能为空！'});
                return;
            }
            if(await this.isExistUser(classes.id)){
                this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'班存在用户，不能删除！'});
                return;
            }
            let delClssSql='DELETE FROM  app_school_classes WHERE id = ?';
            let p = await this.query(delClssSql,{replacements:[classes.id],type:this.QueryTypes.DELETE});
            return p;
        }catch (error) {
            this.makeJSON(res, "DB_ERROR", {data: null, result: 'failed'});
            console.error('router:/classes/deleteClazz');
            console.log(error);
        }
    }
    async isExistUser(clazz_id){
        let sql = 'SELECT count(id) as count FROM app_user where school_classes_id = ? ';
        let count =await this.query(sql,{replacements:[clazz_id],type:this.QueryTypes.SELECT});
        console.log(count);
        return count[0].count>0;
    }
    async getClazz(req){
        return {
            'id':parseInt(req.body.id)||null,
            'app_school_id':req.body.app_school_id||null,
            'app_classes_id':req.body.app_classes_id||null,
            'classes_name':req.body.classes_name||'',
            'student_amount':req.body.student_amount||null,
            'pageIndex':parseInt(req.body.pageIndex)||1,
            'pageCount':parseInt(req.body.pageCount)||30
        }
    }
    /**
     *
     * @param user
     * @returns {'parameters':[],whereSql:'and name = zhans  and account= qwerrtt'}
     */
    async getParamteClasses(clazz){
        // let result={'parameters':[],whereSql:''};
        let parameters = [];
        let whereSql = ' 1=1 ';
        if(!this.util.isEmpty(clazz.app_school_id)){
            whereSql =whereSql+ ' and app_shcool_id = ? ';
            parameters.push(clazz.app_school_id);
        }
        if(!this.util.isEmpty(clazz.app_classes_id)){
            whereSql = whereSql+' and app_classes_id = ?';
            parameters.push(clazz.year);
        }
        console.log(whereSql);
        return {'parameters':parameters,'whereSql':whereSql};
    }
};