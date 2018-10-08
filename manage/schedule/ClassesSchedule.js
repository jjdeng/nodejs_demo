const Models = require('../models/index.js');
module.exports = class ClassesSchedule extends Models {
    constructor(){
        super();
    }
    async runCreateClasses(year){
        try {
            console.log('执行创建班级');
            await this.transaction(async t=>{
                for(let j = 1;j <=30;j++){
                    if(!await this.isExistClasses(year,j)){
                        await this.query('INSERT INTO app_classes(`year`,classes_no) VALUES(?,?)',
                            {
                                replacements:[year ,j],
                                transaction: t,
                                type:this.QueryTypes.INSERT
                            });
                    }
                }
            });
        }catch (e) {
            console.error('定时任务生成基础年级数据失败！',e);
        }

    }
    async isExistClasses(year ,classes_no){
        let result = await this.query('SELECT count(id) as count FROM app_classes WHERE year = ? and classes_no = ?',
            {
                replacements:[year ,classes_no],
                type:this.QueryTypes.SELECT
            });
        return result[0].count>0
    }

};