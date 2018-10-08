const  Sequelize = require('sequelize');
const args = process.argv.splice(2);
const tableName=args[0];
const dataTotal=args[1];
if(!tableName){
    console.error('failed:表名必须要传入！');
    return
}
if(!dataTotal){
    console.error('failed:导入目标必须要传入！');
    return
}
run(tableName,dataTotal).then((r)=>{
    console.log(r);
    process.exit();
}).catch(e=>{
    console.error(e);
    process.exit();
});



async function run(tableName,dataTotal) {
    try {
        const Modal=new Sequelize('xxy_db','root','newxuexiyouMima123()',{
            host:'rm-wz9obb91e6t1dzuc14o.mysql.rds.aliyuncs.com',
            dialect: 'mysql',
            timezone: 'Asia/Shanghai'
        });
        const support_table=['app_check_page','app_topic','app_picture'];
        if(support_table.indexOf(tableName)===-1){
            return `不支持操作的表`
        }
        let [{nowTotal}]=await Modal.query(`SELECT COUNT(id) AS nowTotal FROM ${tableName}`,{type:Modal.QueryTypes.SELECT});
        if(nowTotal>=dataTotal){
            return `${tableName} 表当前总行数为:${nowTotal}，大于等于目标数量${dataTotal}！`
        }
        let sql=''
        let arr=[];
        switch (tableName) {
            case 'app_check_page':
                sql=`INSERT INTO app_check_page(
                    app_user_id,
                    page_id,
                    \`data\`,
                    check_step,
                    picture_id,
                    check_result_img,
                    \`cache\`)
                    VALUES`;
                arr=[
                    1,
                    32956,
                    `'[{"active":true,"id":309528,"page_id":32956,"rank":0,"index":26,"parent_id":0,"position":[{"positionX":488.99999999999994,"positionY":4548.350337203996,"width":4589,"height":2211}],"des_id":253371,"topic_number":"{\\"num\\":\\"1\\",\\"type\\":2}","answers":[{"positionX":820,"positionY":5508,"width":495,"height":203,"judgeType":"1","type":1,"content":{"type":0,"text":"坪坝"},"judgment":2},{"positionX":1607,"positionY":5504,"width":495,"height":203,"judgeType":"1","type":1,"content":{"type":0,"text":"好奇"},"judgment":2},{"positionX":2395,"positionY":5500,"width":495,"height":203,"judgeType":"1","type":1,"content":{"type":0,"text":"孔雀"},"judgment":2},{"positionX":3182,"positionY":5495,"width":495,"height":203,"judgeType":"1","type":1,"content":{"type":0,"text":"游戏"},"judgment":2},{"positionX":3969.9999999999995,"positionY":5491,"width":495,"height":203,"judgeType":"1","type":1,"content":{"type":0,"text":"花瓣"},"judgment":2},{"positionX":820,"positionY":6317,"width":497.9999999999999,"height":203,"judgeType":"1","type":1,"content":{"type":0,"text":"蝴蝶"},"judgment":2},{"positionX":1610,"positionY":6313,"width":495,"height":203,"judgeType":"1","type":1,"content":{"type":0,"text":"勇气"},"judgment":2},{"positionX":2398,"positionY":6313,"width":495,"height":203,"judgeType":"1","type":1,"content":{"type":0,"text":"绒毛"},"judgment":2},{"positionX":3185,"positionY":6308,"width":495,"height":203,"judgeType":"1","type":1,"content":{"type":0,"text":"摇晃"},"judgment":2},{"positionX":3973,"positionY":6300,"width":495,"height":203,"judgeType":"1","type":1,"content":{"type":0,"text":"手掌"},"judgment":2}],"show_info":"/images/146/topic/253371.png","dir_id":23406,"dir_rank":0,"dir_start_page":1,"s":[{"positionX":488.99999999999994,"positionY":4548.350337203996,"width":4589,"height":2211}],"children":[],"p":[{"positionX":488.99999999999994,"positionY":4548.350337203996,"width":4589,"height":2211}],"swap_data":{"left_offset":0},"ocrJudgment":0,"x":32.273999999999994,"y":400.25482967395163,"w":302.87399999999997,"h":194.56799999999998,"topicJudgment":2,"topic_mat_name":"1533639939.9790998_7408_309528.png","cut_picture_src":"/userData/1/workCheck/1533639939.9790998_7408_309528.png","cut_picture":{"id":62,"width":1073,"height":769,"src":"/userData/1/workCheck/1533639939.9790998_7408_309528.png"}}]'`,
                    0,
                    61,
                    `'/workCheck/people_2018_07_25_15_26_21_6_workCheck.jpg_changed.jpg'`,
                    `'{"book_id":["213"],"page_index":"29","chooseTopic_picture":"/userData/1/workCheck/2018_07_25_15_26_21_6_workCheck.jpg_ad.jpg","thread_id":"1533639939.9790998_7408","position":{"p":[[0,72],[2952,72],[0,4104],[3088,3996]],"style":"0","v":"0"},"file_name":"2018_07_25_15_26_21_6_workCheck.jpg","topicData":[{"id":309528,"page_id":32956,"rank":0,"index":5,"parent_id":0,"position":[{"positionX":330,"positionY":952.0000000000001,"width":4597.291518175339,"height":3891.236466076095}],"des_id":309528,"topic_number":"{\\"num\\":5,\\"type\\":1}","answers":[{"parentIndex":0,"positionX":330,"positionY":952.0000000000001,"width":4597.291518175339,"height":3891.236466076095,"judgeType":"1","type":0,"content":{"type":0,"text":"走第③条路最近，因为三角形的两边之和大于第三边。"}}],"show_info":"/images/213/topic/309528.png","dir_id":30666,"dir_rank":1,"dir_start_page":28,"s":[{"positionX":330,"positionY":952.0000000000001,"width":4597.291518175339,"height":3891.236466076095}],"children":[],"p":[{"positionX":330,"positionY":952.0000000000001,"width":4597.291518175339,"height":3891.236466076095}],"swap_data":{"left_offset":0},"ocrJudgment":2},{"id":309533,"page_id":32956,"rank":0,"index":6,"parent_id":0,"position":[{"positionX":330,"positionY":5575.043274615619,"width":4632.929436920884,"height":3880.9693513898787}],"des_id":309533,"topic_number":"{\\"num\\":6,\\"type\\":1}","answers":[{"parentIndex":0,"positionX":330,"positionY":6991.905101313511,"width":4632.929436920884,"height":2464.107524691987,"judgeType":"1","type":0,"content":{"type":1,"text":"/images/213/answer/309533_0.png","imgInfo":[1148,425.4492753623188]}}],"show_info":"/images/213/topic/309533.png","dir_id":30666,"dir_rank":1,"dir_start_page":28,"s":[{"positionX":330,"positionY":5575.043274615619,"width":4632.929436920884,"height":3880.9693513898787}],"children":[],"p":[{"positionX":330,"positionY":5575.043274615619,"width":4632.929436920884,"height":3880.9693513898787}],"swap_data":{"left_offset":0},"ocrJudgment":2}],"chooseTopic_picture_width":4160,"chooseTopic_picture_height":3120,"filenamePath":"/userData/workCheck/2018_07_25_15_26_21_6_workCheck.jpg"}'`
                ];
                break;
            case 'app_topic':
                sql=`INSERT INTO app_topic(
                    topic_id,
                    app_user_id,
                    \`type\`,
                    check_result,
                    app_check_page_id,
                    work_picture_id)
                    VALUES`;
                arr=[
                    308567,
                    1,
                    2,
                    `'{"active":true,"id":308567,"page_id":32929,"rank":1,"index":1,"parent_id":308566,"position":[{"positionX":5074.839629365645,"positionY":5667.447306791569,"width":2473.271560940841,"height":1919.9504463225062}],"des_id":308567,"topic_number":"{\\"num\\":1,\\"type\\":3}","answers":[{"parentIndex":0,"positionX":5944.40484675695,"positionY":6673.624546040797,"width":662.8652886671418,"height":698.1637986627295,"judgeType":"0","type":3,"content":{"type":0,"text":"no"},"judgment":2}],"show_info":"/images/213/topic/308567.png","dir_id":30653,"dir_rank":1,"dir_start_page":2,"children":[],"swap_data":{"left_offset":0},"ocrJudgment":0,"x":334.93941553813255,"y":498.73536299765806,"w":163.2359230220955,"h":168.95563927638054,"topicJudgment":2,"topic_mat_name":"1533630237.183211_1783_308567.png","cut_picture_src":"/userData/1/workCheck/1533630237.183211_1783_308567.png","cut_picture":{"id":2,"width":860,"height":449,"src":"/userData/1/workCheck/1533630237.183211_1783_308567.png"}}'`,
                    1,
                    2
                ];
                break;
            case 'app_picture':
                sql=`INSERT INTO app_picture(
                    path,
                    width,
                    height)
                    VALUES`;
                arr=[
                    `'/userData/1/workCheck/2018_08_07_16_23_55_0667_workCheck.jpg'`,
                    4160,
                    3120
                ];
                break;
        }


        let p_arr=[];
        for(let i=0;i<1000;i++){
            p_arr.push(`(${arr.join(',')})`);
        }
        let n=parseInt((dataTotal-nowTotal)/1000);
        for(let i=0;i<n;i++){
            await Modal.query(sql+p_arr.join(','),{type:Modal.QueryTypes.INSERT});
        }
        return `${tableName} 表当前总行数为:${n*1000+nowTotal}，新增${n*1000}条无效数据！`
    }catch (e) {
        throw e
    }
}