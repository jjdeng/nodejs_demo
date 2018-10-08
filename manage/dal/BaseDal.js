/**
 * 基本数据层
 */
const util = require("../smart/Util")
const codeConf = require("../config/code.config")
const Models = require('../models/index.js');
module.exports = class BaseDal extends Models{
	constructor(){
		super();
		this.util = util;
	}
	/**
	 * 获取用户session信息
	 */
	getUserSessionInfo(req){
		return this.util.getSession(req, "user")
	}
	/**
	 * 设置用户session信息
	 */
	setUserSessionInfo(req, userInfo){
		this.util.setSession(req, "user", userInfo)
	}
    /**
     * 生成json响应
     */
    makeJSON(res, status, data){
        res.end(JSON.stringify(Object.assign({},codeConf[status],data)));
    }
    /**
     * 校验参数以及类型是否正确
     * res res对象
     * parameters 参数对象 {name:'123',age:12}
     * arr 需要校验的参数数组 [{name:'name',type:'string',optional:false}]
     * name 校验的参数名字
     * type 校验的参数类型
     * optional 参数是否是可选 默认不是可选的
     * 支持校验的类型有 string number JSON_string
     */
    checkParametersType(res,parameters={},arr=[]){
        let result=[];
        for(let i=0;i<arr.length;i++){
            let option=arr[i];
            let obj={optional:false};
            if(typeof option === 'object' && !Array.isArray(option)){
                obj=option;
            }else if(typeof option === 'object' && Array.isArray(option)){
                obj.name=option[0];
                obj.type=option[1];
                obj.optional=option[2] || false;
            }else{
                obj.name=option
            }
            //判断参数是否存在，存在的话继续校验类型
            if(parameters[obj.name]===undefined){
                if(!obj.optional){
                    result.push(`The ${obj.name} is undefined`);
                }
            }else{
                switch (obj.type){
                    case 'string':
                        if(typeof parameters[obj.name]!=='string'){
                            result.push(`The ${obj.name} is not a ${obj.type}`);
                        }else{
                            if(parameters[obj.name]===''){
                                result.push(`The ${obj.name} cannot be an empty string`);
                            }
                        }
                        break;
                    case 'number':
                        if(!this.isRealNum(parameters[obj.name])){
                            result.push(`The ${obj.name} is not a ${obj.type}`);
                        }
                        break;
                    case 'JSON_string':
                        try {
                            JSON.parse(parameters[obj.name]);
                        }catch (e) {
                            result.push(`The ${obj.name} is not a ${obj.type}`);
                        }
                        break;
                }
            }
        }
        if(result.length!=0){
            this.makeJSON(res, "BAD_REQUEST", {msg:'错误的请求！缺少参数或者非法类型:\n'+result.join(',\n'),data:null,result:'failed'});
            return false;
        }else{
            return true
        }
    }
    isRealNum(val){
        // isNaN()函数 把空串 空格 以及NUll 按照0来处理 所以先去除
        if(val === "" || val ==null){
            return false;
        }
        if(!isNaN(val)){
            return true;
        }else{
            return false;
        }
    }
    async getTreas(result, parent_id) {
        var childrens = [];
        for(var i in result) {
            if(result[i].parent_id == parent_id) {
                result[i].children =await this.getTreas(result, result[i].id);
                childrens.push(result[i]);
            }
        }
        return childrens;
    }
}