/**
 * @apiDefine PhoneArea  A手机号码归属地
 */
const BaseDal = require('./BaseDal');
var http = require('http');
module.exports = class PhoneAreaDal extends BaseDal {
    /**
     * @api {POST} /phoneArea/pacthCheckPhoneArea *校验手机号的归属地
     * @apiGroup PhoneArea
     * @apiParam {string}  startTime  // 2018-07-19 13:58:03
     * @apiParam {string}  endTime  // 2018-07-17 13:58:03
     * @apiSuccessExample 返回结果:
     *  {
           "code": "0x000000",
            "msg": "操作成功！",
            "data":null  //这里操作有一点点的久 调用接口前端页面可能会等待超时
         }
     *
     */
    async pacthCheckPhoneArea(req,res) {
        try {
            let  startTime = req.body.startTime;
            let  endTime = req.body.endTime;
            if(this.util.isEmpty(startTime)||this.util.isEmpty(endTime)){
                this.makeJSON(res, "BAD_REQUEST", {data: null, result: 'failed'});
                return;
            }
            let phoneList = await this.getPhoneList(startTime,endTime);
            console.log(phoneList);
            if(phoneList==null&&phoneList.length>0){
                console.log("查询用户的电话列表为空！");
                return;
            }
            for (let i = 0; i < phoneList.length ; i++) {
                if(phoneList[i].uid.length==11 && this.util.stringIsNumber(phoneList[i].uid)){
                    this.addPhoneMain(phoneList[i].uid);
                }else{
                    console.log(`手机号${phoneList[i].uid}`);
                }
            }
            this.makeJSON(res, "SUCCESS", {data: null, result: 'success'});
        }catch (e) {
            console.error('PhoneAreaDal/pacthCheckPhoneArea ', e);
            this.makeJSON(res, "DB_ERROR", {data: null, result: 'failed',msg:'系统执行出错！/phoneArea/pacthCheckPhoneArea '});
        }
    }

    /**
     *
     * @param phoneNum
     * @returns {Promise<void>}
     */
    async getPhoneList(startTime,endTime){
        try {
            let sql = 'SELECT uid FROM app_third_user WHERE app_type =1 and  create_date BETWEEN ? and  ?';
            let phoneList = await this.query(sql,{replacements:[startTime,endTime],type:this.QueryTypes.SELECT});
            return phoneList;
        }catch (e) {
            console.error('PhoneAreaDal/pacthCheckPhoneArea ', e);
        }
    }
    /**
     *
     * @param phoneNum
     * @returns {Promise<void>}
     */
    async addPhoneMain(phoneNum){
        console.log(`添加${phoneNum}的归属地信息开始`);
        let addData = {
            "company":"",
            "card":"",
            "province":"",
            "city":"",
            "num":"",
            "citycode":"",
            "areacode":"",
            "provincecode":"",
            "zip":"",
            "prefix":""};
        if(await this.isExistPhone(phoneNum)){
            console.log(`已经存在${phoneNum}的归属地信息`);
            return;
        }else{
            let postResult =  await this.getPhoneAreaHttp(phoneNum);
            if(typeof(postResult)=='string'){
                postResult = JSON.parse(postResult);
            }
            if(postResult.error_code!=0){
                console.log('phoneNum'+postResult.reason);
            }else{
                addData = postResult.result;
            }
            this.addPhoneArea(phoneNum,addData);
        }
    }
    /**
     * 手机归属地查询 Authorization:APPCODE 3F2504E04F8911D39A0C0305E82C3301
     * http://mobileas.market.alicloudapi.com/mobile
     * @param phoneNumber
     */
    getPhoneAreaHttp(phoneNumber){
        try{
            var options = {
                hostname: 'mobileas.market.alicloudapi.com',
                path: `/mobile?mobile=${phoneNumber}`,
                method: 'GET',
                headers:{
                    Authorization:'APPCODE f306b9a132dd45fb901f472f687be88a'
                }
            };
            return new Promise(((resolve,reject) => {
                var req = http.request(options,  (ress)=>{
                    console.log('STATUS: ' + ress.statusCode);
                    ress.setEncoding('utf8');
                    ress.on('data', function (chunk) {
                        console.log('BODY: ' + chunk);
                        let data = chunk;
                        resolve( data );
                    });
                });
                req.on('error', (e)=> {
                    reject( err );
                    console.error('problem with request: ' + e.message);
                });
                req.end();
            }));
        }catch(e){
            console.error("queryPhoneArea执行出错", e)
        }
    }

    /**
     * tainj
     * @param objs
     */
    async addPhoneArea(phoneNum,result){
        console.log(typeof(result));
        try {
            let d = await this.query('INSERT INTO sys_phone(phone_num,province,city,city_code,`data`)VALUES(?,?,?,?,?)',
                {
                    replacements:[phoneNum,result.provincecode||'',result.areacode||'',result.citycode||'',JSON.stringify(result)],
                    type:this.QueryTypes.INSERT
                });
            console.log(`传入数据${phoneNum}，执行结果：`,d );

        }catch (e) {
            console.error("addPhoneArea执行出错", e)
        }
    }

    /**
     * 是否存在数据
     * @param phone_num
     * @returns {Promise<boolean>}
     */
    async isExistPhone(phone_num){
        try {
           let countObj = await  this.query('SELECT COUNT(phone_num) as count FROM sys_phone  WHERE phone_num = ?',{replacements:[phone_num],type:this.QueryTypes.SELECT});
           return countObj[0].count>0;
        }catch (e) {
            console.error("addPhoneArea执行出错", e)
        }
    }
};