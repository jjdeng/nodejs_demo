/**
 * @apiDefine AppInfo  App版本管理接口
 */
const  BaseDal = require('./BaseDal');
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const ossClent = require('../smart/OSS_control');
//const downURL = 'https://xxy-files.oss-cn-shenzhen.aliyuncs.com';
const xxy_path ='https://app.xuexiyou.cn:8000';
module.exports = class SysAppInfo extends BaseDal{
    /**
     * @api {POST} /appInfo/selectAppInfos *APP版本查询
     * @apiGroup AppInfo
     * @apiParam {id} id 版本 id
     * @apiParam {string} app_agent 系统：android  ios
     * @apiParam {int} app_code 版本号
     * @apiParam {string} app_version 版本名称
     * @apiParam {string} app_describe 更新说明
     * @apiParam {int} is_force_update 是否强制更新 1:是 2 不是
     * @apiParam {int} app_status  0:禁用 1:启用
     * @apiParam {string} web_url  web页面文件路径名称
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
    async selectAppInfos(req, res){
        try {
            let appInfo = {
                'id': parseInt(req.body.id),
                'app_agent': req.body.app_agent || '',
                'app_code': req.body.app_code || null,
                'app_version': req.body.app_version || '',
                'app_size': req.body.app_size || null,
                'down_url': req.body.down_url || '',
                'app_describe': req.body.app_describe || '',
                'is_force_update': req.body.is_force_update || null,
                'app_status':req.body.app_status || null,
                'web_url':req.body.web_url||'',
                'pageIndex': parseInt(req.body.pageIndex) || 1,
                'pageCount': parseInt(req.body.pageCount) || 30
            };
            console.log(appInfo);
            this.makeJSON(res, "SUCCESS", {result: 'success', data:await  this.getAppInfoPages(appInfo),msg:'查询成功'});
        }catch (e) {
            console.log('/appInfo/selectAppInfos',e);
            this.makeJSON(res, "SERVER_ERROR", {result: 'success',data:null});
        }
    }
    /**
     * @api {POST} /appInfo/deleteAppInfoAction * 删除app版本信息
     * @apiGroup AppInfo
     * @apiParam {int} id 版本 id
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
    async deleteAppInfoAction(req,res){
        try {
            let id = req.body.id;
            if(this.util.isEmpty(id)&&!this.util.stringIsNumber(id)){
                this.makeJSON(res, "BAD_REQUEST", {result: 'success',data:null});
            }
            let result;
            await this.transaction(async t=>{
                //删除记录
                result = await this.deleteAppInfo({id:id},t);
                //删除文件
                let appInfoList =await this.getAppInfoList({'id':id});
                if(appInfoList!=null && appInfoList.length>0 ){
                    let path = appInfoList[0].down_url;
                    console.log(path);
                    ossClent.remove(path.substring(path.lastIndexOf('/sysFiles')));
                }
            });
            this.makeJSON(res, "SUCCESS", {result: 'success',data: result,msg:'删除成功！'});
        }catch (e) {
            console.log('/appInfo/deleteAppInfo0',e);
            this.makeJSON(res, "SERVER_ERROR", {result: 'success',data:null});
        }
    }
    /**
     *
     * @param user
     * @returns {'parameters':[],whereSql:'and name = zhans  and account= qwerrtt'}
     */
    async getParamteAppInfo(appInfo){
        // let result={'parameters':[],whereSql:''};
        let parameters = [];
        let whereSql = ' ';
        if(!this.util.isEmpty(appInfo.app_agent)){
            whereSql =whereSql+ ' and app_agent = ? ';
            parameters.push(this.util.getTrimedStr(appInfo.app_agent).toLowerCase());
        }
        if(!this.util.isEmpty(appInfo.id)&&this.util.stringIsNumber(appInfo.id)){
            whereSql =whereSql+ ' and id = ? ';
            parameters.push(appInfo.id);
        }
        if(!this.util.isEmpty(appInfo.app_status)&&this.util.stringIsNumber(appInfo.app_status)){
            whereSql =whereSql+ ' and app_status = ? ';
            parameters.push(appInfo.app_status);
        }
        if(!this.util.isEmpty(appInfo.app_code)&&this.util.stringIsNumber(appInfo.app_code)){
            whereSql =whereSql+ ' and app_code = ? ';
            parameters.push(appInfo.app_code);
        }
        console.log(whereSql);
        return {'parameters':parameters,'whereSql':whereSql};
    }
    async getAppInfoPages(appInfo){
        console.log('查询版本信息（分页）');
        let sql  = 'SELECT  id,app_agent,app_code,app_version,app_size,down_url,web_url,app_status,app_describe,is_force_update,DATE_FORMAT(create_date,"%Y-%m-%d %H:%i:%s") as create_date FROM xxy_db.app_version  WHERE 1=1 ';
        let sqlcount  = 'SELECT count(id) as count FROM xxy_db.app_version WHERE 1=1  ';
        let params = await this.getParamteAppInfo(appInfo);
        let parameters = params.parameters;
        parameters.push((appInfo.pageIndex-1)*appInfo.pageCount);
        parameters.push(appInfo.pageCount);
        let AppInfoList =await this.query(sql+params.whereSql+'ORDER BY create_date DESC limit ?,? ',{replacements:parameters,type:this.QueryTypes.SELECT});
        let count =await this.query(sqlcount+params.whereSql,{replacements:parameters,type:this.QueryTypes.SELECT});
        return {'count':count[0].count,'AppInfoList':AppInfoList};
    }
    async getAppInfoList(appInfo){
            let sql  = 'SELECT  id,app_agent,app_code,app_version,app_size,down_url,web_url,app_status,app_describe,is_force_update,DATE_FORMAT(create_date,"%Y-%m-%d %H:%i:%s") as create_date FROM xxy_db.app_version  WHERE 1=1  ';
            let params = await this.getParamteAppInfo(appInfo);
            let parameters = params.parameters;
            let AppInfoList =await this.query(sql+params.whereSql+' ORDER BY create_date ',{replacements:parameters,type:this.QueryTypes.SELECT});
            return AppInfoList;
    }
    async addAppInfo(appInfo,res){
        console.log('添加版本数据');
        try {
            if(this.util.isEmpty(appInfo.app_code)||!this.util.stringIsNumber(appInfo.app_code)){
                this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'版本号app_code为空或非法'});
                return;
            }
            if(this.util.isEmpty(appInfo.app_version)){
                this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'版本名称app_version为空！'});
                return;
            }
            if(this.util.isEmpty(appInfo.app_describe)){
                this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'版本更新描述说明app_describet为空！'});
                return;
            }
            let intClsSql = 'INSERT INTO xxy_db.app_version(app_agent,app_code,app_version,app_size,down_url,app_describe,is_force_update) VALUES(?,?,?,?,?,?,?)';
            let te= await this.query(intClsSql,{replacements: [appInfo.app_agent,appInfo.app_code,appInfo.app_version,appInfo.app_size,appInfo.down_url,
                    appInfo.app_describe,appInfo.is_force_update],type: this.QueryTypes.INSERT });
            appInfo.id = te[0];
            return appInfo;
        }catch (error) {
            this.makeJSON(res, "DB_ERROR", {data: null, result: 'failed'});
            console.error('router:/appInfo/addAppInfo');
            console.log(error);
        }
    }

    async deleteAppInfo(appInfo,t){
        let delSql='DELETE FROM  xxy_db.app_version WHERE id = ?';
        await this.query(delSql,{replacements:[appInfo.id],transaction: t,type:this.QueryTypes.DELETE});
        console.log('删除成功');
        return {isSuccess:true};
    }
    /**
     * @api {POST} /appInfo/updateAppInfo 更新APP版本信息
     * @apiGroup AppInfo
     * @apiParam {file} id
     * @apiParam {file} file 选择上传的文件
     * @apiParam {string} app_agent 系统：android  ios
     * @apiParam {int} app_code 版本号
     * @apiParam {string} app_version 版本名称
     * @apiParam {string} app_describe 更新说明
     * @apiParam {int} app_status  0:禁用 1:启用
     * @apiParam {string} web_url  web页面文件路径名称
     * @apiParam {int} is_force_update 是否强制更新 1:是 2 不是
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
    async updateAppInfo(req,res){
        try {
            console.log('更新文件文件');
            let form = new formidable.IncomingForm();
            form.encoding = 'utf-8';
            let pathDir = path.join(__dirname,'../upload/sysFiles/app_apk/');
            form.uploadDir=pathDir;
            if(!this.util.fsExistsSync(pathDir)){
                this.util.createDirsSync(pathDir);
            }
            form.keepExtensions = true;//保留后缀
            form.maxFieldsSize = 200 * 1024 * 1024;//200M
            //文件
            let {fields,files}=await new Promise(function (resolve, reject) {
                form.parse(req,(err, fields, files)=>{
                    if(err){
                        reject(err);
                    }else{
                        resolve({
                            fields:fields,
                            files:files
                        })
                    }
                });
            });

            if(!files.file){
                this.makeJSON(res, "BAD_REQUEST", {msg:'获取表单中的name为file失败！',data:null,result:'failed'});
                return '';
            }
            let size= files.file.size;
            // if(size<=0){
            //     this.makeJSON(res, "BAD_REQUEST", {msg:'请选择上传的文件！',data:null,result:'failed'});
            //     return '';
            // }

            if(this.util.isEmpty(fields.id)&&this.util.stringIsNumber(fields.id)){
                this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'id为空！'});
                return;
            }
            // if(this.util.isEmpty(fields.app_code)||!this.util.stringIsNumber(fields.app_code)){
            //     this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'版本号app_code为空或非法'});
            //     return;
            // }
            // if(this.util.isEmpty(fields.app_version)){
            //     this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'版本名称app_version为空！'});
            //     return;
            // }
            // if(this.util.isEmpty(fields.app_describe)){
            //     this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'版本更新描述说明app_describet为空！'});
            //     return;
            // }
            // if(this.util.isEmpty(fields.web_url)){
            //     this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'web_url为空！'});
            //     return;
            // }

            console.log(fields);
            //根据id查询app_verison信息
            let appInfoList =await this.getAppInfoList({'id':fields.id},res);
            await this.transaction(async t=>{
                if(size>1){
                    //删除文件
                    let path = appInfoList[0].down_url;
                    console.log(path);
                    ossClent.remove(path.substring(path.lastIndexOf('/sysFiles')));
                    //上传文件
                    let filePath = files.file.path;
                    let  fileExt = filePath.substring(filePath.lastIndexOf('.'));
                    let filename ='xxy_'+fields.app_agent+'_' +fields.app_version+fileExt;
                    let ossPath = '/sysFiles/app_apk/'+filename;
                    //缓存本地写在本地 并上传到服务器
                    fs.renameSync(filePath, pathDir+filename);
                    ossClent.put(ossPath,pathDir+filename);
                    fields.down_url= xxy_path+ossPath;
                    fields.app_size=(size/(1024 * 1024)).toFixed(1);
                }
                //删除记录
                let result = await this.deleteAppInfo(appInfo,res);
                let intClsSql = 'INSERT INTO xxy_db.app_version(app_agent,app_code,app_version,app_size,down_url,app_describe,is_force_update) VALUES(?,?,?,?,?,?,?)';
                //删除记录
                await this.deleteAppInfo({'id':fields.id},t);
                let te= await this.query(intClsSql,
                    {
                        replacements: [
                            fields.app_agent||appInfoList[0].app_agent,
                            fields.app_code||appInfoList[0].app_code,
                            fields.app_version||appInfoList[0].app_version,
                            fields.app_size||appInfoList[0].app_size,
                            fields.down_url||appInfoList[0].down_url,
                            fields.app_describe||appInfoList[0].app_describe,
                            fields.is_force_update||appInfoList[0].is_force_update
                        ],
                        transaction:t,
                        type: this.QueryTypes.INSERT });
            });
            fields.id = te[0];
            this.makeJSON(res, "SUCCESS", {result: 'success', data:appInfo,msg:'成功'});
        }catch (error) {
            this.makeJSON(res, "DB_ERROR", {data: null, result: 'failed'});
            console.error('router:/classes/updateAppInfo');
            console.log(error);
        }
    }
    /**
     * @api {POST} /appInfo/addAppInfoAction 新增APP版本信息
     * @apiGroup AppInfo
     * @apiParam {file} file 选择上传的文件
     * @apiParam {string} app_agent 系统：android  ios
     * @apiParam {int} app_code 版本号
     * @apiParam {string} app_version 版本名称
     * @apiParam {string} app_describe 更新说明
     * @apiParam {int} is_force_update 是否强制更新 1:是 2 不是
     * @apiParam {int} app_status  0:禁用 1:启用
     * @apiParam {string} web_url  web页面文件路径名称
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
    async addAppInfoAction(req,res){
        try {
            console.log('上传文件');
            let form = new formidable.IncomingForm();
            form.encoding = 'utf-8';
            let pathDir = path.join(__dirname,'../upload/sysFiles/app_apk/');
            form.uploadDir=pathDir;
            if(!this.util.fsExistsSync(pathDir)){
                this.util.createDirsSync(pathDir);
            }
            form.keepExtensions = true;//保留后缀
            form.maxFieldsSize = 200 * 1024 * 1024;//200M
            //文件
            let {fields,files}=await new Promise(function (resolve, reject) {
                form.parse(req,(err, fields, files)=>{
                    if(err){
                        reject(err);
                    }else{
                        resolve({
                            fields:fields,
                            files:files
                        })
                    }
                });
            });

            if(!files.file){
                this.makeJSON(res, "BAD_REQUEST", {msg:'获取表单中的name为file失败！',data:null,result:'failed'});
                return '';
            }
            let size= files.file.size;
            if(size<=0){
                this.makeJSON(res, "BAD_REQUEST", {msg:'请选择上传的文件！',data:null,result:'failed'});
                return '';
            }
            let filePath = files.file.path;
            let  fileExt = filePath.substring(filePath.lastIndexOf('.'));
            let appInfo ={
                'app_agent': fields.app_agent || '',
                'app_code': fields.app_code || null,
                'app_version': fields.app_version || '',
                'app_describe': fields.app_describe || '',
                'is_force_update': fields.is_force_update || null
            };
            console.log(appInfo);
            if(this.util.isEmpty(appInfo.app_code)||!this.util.stringIsNumber(appInfo.app_code)){
                this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'版本号app_code为空或非法'});
                return;
            }
            if(this.util.isEmpty(appInfo.app_version)){
                this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'版本名称app_version为空！'});
                return;
            }
            if(this.util.isEmpty(appInfo.app_describe)){
                this.makeJSON(res,'OTHER_ERROR',{result:'failed',data:null,msg:'版本更新描述说明app_describet为空！'});
                return;
            }
            let filename ='xxy_'+appInfo.app_agent+'_' +appInfo.app_version+fileExt;
            let ossPath = '/sysFiles/app_apk/'+filename;
            //缓存本地写在本地
            fs.renameSync(filePath, pathDir+filename);
            ossClent.put(ossPath,pathDir+filename);
            appInfo.down_url= xxy_path+ossPath;
            appInfo.app_size=(size/(1024 * 1024)).toFixed(1);
            let intClsSql = 'INSERT INTO xxy_db.app_version(app_agent,app_code,app_version,app_size,down_url,app_describe,is_force_update) VALUES(?,?,?,?,?,?,?)';
            let te= await this.query(intClsSql,{replacements: [appInfo.app_agent,appInfo.app_code,appInfo.app_version,appInfo.app_size,appInfo.down_url,
                    appInfo.app_describe,appInfo.is_force_update],type: this.QueryTypes.INSERT });
            appInfo.id = te[0];
            this.makeJSON(res, "SUCCESS", {result: 'success', data:appInfo,msg:'添加成功'});
        }catch (error) {
            this.makeJSON(res, "DB_ERROR", {data: null, result: 'failed'});
            console.error('router:/classes/addAppInfoAction');
            console.log(error);
        }
    }

};