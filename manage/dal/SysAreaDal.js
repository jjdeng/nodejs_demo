/**
 * @apiDefine Area  省市区接口
 */
const  BaseDal = require('./BaseDal');
module.exports = class SysAreaDal extends BaseDal{

    /**
     * @api {POST} /area/getProvices  *查询省份
     * @apiGroup Area
     *
     * @apiSuccessExample 返回结果:
     *  {
           "code": "0x000000",
            "msg": "操作成功！",
            "data": [
                {
                    "provinceid": "110000",
                    "province": "北京市"
                },
                {
                    "provinceid": "120000",
                    "province": "天津市"
                },
                {
                    "provinceid": "130000",
                    "province": "河北省"
                },
                ....
                ]
            }
     *
     */
    async getProvices(req,res){
        try {
            let sql = 'SELECT provinceid,province FROM xxy_db.app_provinces';
            let provinces = await  this.query(sql,{type:this.QueryTypes.SELECT});
            this.makeJSON(res,'SUCCESS',{data:provinces,result:'success'});
            //this.makeJSON(res, "SUCCESS", {data:true,result:'succes',msg:'修改用户名成功！'});
        }catch (error) {
            console.error(error);
            console.error('router:/area/getProvices');
            this.makeJSON(res, "DB_ERROR", {data: null, result: 'failed'});
        }
    }
    /**
     * @api {POST} /area/getCities  *查询城市
     * @apiGroup Area
     * @apiParam {string}  provicesid  省代码 //不传查询所有
     *
     * @apiSuccessExample 返回结果:
     *  {
         *      "code": "0x000000",
                "msg": "操作成功！",
                "data": [
                    {
                        "cityid": "110100",
                        "city": "成都市"
                    }
                    .......
                ],
                "result": "success"
         *
         *  }
     *
     */
    async getCities(req,res){
        try {
            let provicesid = req.body.provicesid;
            let sql  = 'SELECT cityid,city FROM xxy_db.app_cities WHERE 1=1  ';
            let param = [];
            if(provicesid != null && !this.util.isEmpty(provicesid)){
                sql = sql + 'AND provinceid = ?';
                param.push(provicesid);
            }
            let cities = await  this.query(sql,{replacements:param,type:this.QueryTypes.SELECT});
            this.makeJSON(res,'SUCCESS',{data:cities,result:'success'});
        }catch (error) {
            console.log(error);
            console.error('router:/area/getCities');
            this.makeJSON(res,"DB_ERROR",{data:null,result:'failed'})
        }
    }
    /**
     * @api {POST} /area/getAreas  *查询区县
     * @apiGroup Area
     * @apiParam {string}  cityid 城市代码 //不传查询所有
     *
     * @apiSuccessExample 返回结果:
     *  {
        "code": "0x000000",
        "msg": "操作成功！",
        "data": [
            {
                "areaid": "110101",
                "area": "东城区"
            },
            {
                "areaid": "110102",
                "area": "西城区"
            },
         *      ]
         *
         *  }
     *
     */
    async getAreas(req,res){
        try {
            let cityid = req.body.cityid;
            let sql  = 'SELECT areaid,area from xxy_db.app_areas where 1=1   ';
            let param = [];
            if(cityid != null && !this.util.isEmpty(cityid)){
                sql = sql + 'AND cityid = ?';
                param.push(cityid);
            }
            let areas = await  this.query(sql,{replacements:param,type:this.QueryTypes.SELECT});
            this.makeJSON(res,'SUCCESS',{data:areas,result:'success'});
        }catch (error) {
            console.error(error);
            console.error('router:/area/getAreas');
            this.makeJSON(res,"DB_ERROR",{data:null,result:'failed'})
        }
    }

};