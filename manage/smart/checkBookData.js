const  Sequelize = require('sequelize');
const App_Modal=new Sequelize('xxy_db','root','newxuexiyouMima(123)db',{
    host:'rm-wz9obb91e6t1dzuc14o.mysql.rds.aliyuncs.com',
    dialect: 'mysql',
    timezone: 'Asia/Shanghai'
});
const Luti_Modal=new Sequelize('xxy_db','root','newmysqlpassword123()Mima',{
    host:'47.106.158.172',
    dialect: 'mysql',
    timezone: 'Asia/Shanghai',
});
async function run() {
    try {
        let app_books=await App_Modal.query(`SELECT id FROM book`,{type:App_Modal.QueryTypes.SELECT});
        let sql_topic=`SELECT t.\`id\` FROM topic AS t INNER JOIN \`directory\` AS d ON d.\`id\`=t.\`directory_id\` AND d.\`book_id\`=?`;
        let sql_pages=`SELECT id FROM pages WHERE book_id=?`;
        let sql_dir=`SELECT id FROM \`directory\` WHERE book_id=?`;
        let topic_err=[];
        let pages_err=[];
        let dir_err=[];
        for(let i=0;i<app_books.length;i++){
            let r_topic=await checkBookData(sql_topic,app_books[i].id);
            let r_pages=await checkBookData(sql_pages,app_books[i].id);
            let r_dir=await checkBookData(sql_dir,app_books[i].id);
            if(r_topic.length!=0){
                topic_err=[...topic_err,...r_topic];
            }
            if(r_pages.length!=0){
                pages_err=[...pages_err,...r_pages];
            }
            if(r_dir.length!=0){
                dir_err=[...dir_err,...r_dir];
            }
        }
        if(topic_err.length!=0){
            console.log('题目数据异常----------------------------------')
            topic_err.forEach(item=>{
                console.log(item);
            })
            console.log('题目数据异常----------------------------------')
        }
        if(pages_err.length!=0){
            console.log('页码数据异常----------------------------------')
            pages_err.forEach(item=>{
                console.log(item);
            })
            console.log('页码数据异常----------------------------------')
        }
        if(dir_err.length!=0){
            console.log('目录数据异常----------------------------------')
            dir_err.forEach(item=>{
                console.log(item);
            })
            console.log('目录数据异常----------------------------------')
        }

        let sql_series=`SELECT b.\`book_series_id\`,s.\`id\` FROM book AS b LEFT JOIN book_series AS s ON s.\`id\`=b.\`book_series_id\` GROUP BY b.\`book_series_id\``;
        let app_series=await App_Modal.query(sql_series,{type:App_Modal.QueryTypes.SELECT});
        let series_err=[];
        app_series.forEach(item=>{
            if(item.book_series_id!==item.id){
                series_err.push(`缺少系列id：${item.book_series_id}`)
            }
        });
        if(series_err.length!=0){
            console.log('系列数据异常----------------------------------')
            series_err.forEach(item=>{
                console.log(item);
            })
            console.log('系列数据异常----------------------------------')
        }
        let sql_version=`SELECT b.\`book_version_id\`,s.\`id\` FROM book AS b LEFT JOIN book_version AS s ON s.\`id\`=b.\`book_version_id\` GROUP BY b.\`book_version_id\``;
        let app_version=await App_Modal.query(sql_version,{type:App_Modal.QueryTypes.SELECT});
        let version_err=[];
        app_version.forEach(item=>{
            if(item.book_version_id!==item.id){
                version_err.push(`缺少版本id：${item.book_version_id}`)
            }
        });
        if(version_err.length!=0){
            console.log('版本数据异常----------------------------------')
            version_err.forEach(item=>{
                console.log(item);
            })
            console.log('版本数据异常----------------------------------')
        }
        console.log(`${app_books.length}本书检查完成`);
    }catch (e) {
        console.error(e);
    }
}
run();
async function checkBookData(sql,book_id) {
    let r=[]
    let app_topics=await App_Modal.query(sql,{
        replacements:[book_id],
        type:App_Modal.QueryTypes.SELECT
    });
    let luti_topics=await Luti_Modal.query(sql,{
        replacements:[book_id],
        type:Luti_Modal.QueryTypes.SELECT
    });
    let {para1_dif,para2_dif}=compare(app_topics,luti_topics);
    if(para1_dif.length!=0){
        let arr=[];
        para1_dif.forEach(item=>{
            arr.push(item.id);
        });
        console.log(`${book_id}号书${arr.join(',')} id在录题系统中不存在！`);
        r.push(`${book_id}号书${arr.join(',')} id在录题系统中不存在！`);
    }
    if(para2_dif.length!=0){
        let arr=[];
        para2_dif.forEach(item=>{
            arr.push(item.id);
        });
        console.log(`${book_id}号书${arr.join(',')} id在app服务器中不存在！`);
        r.push(`${book_id}号书${arr.join(',')} id在app服务器中不存在！`);
    }
    return r;
}

function compare(arr1,arr2){
    arr1=[...arr1];
    arr2=[...arr2];
    let arr1_dif=[];
    for(let i=0;i<arr1.length;i++){
        let isFind=false;
        let item1=arr1[i];
        for(let i=0;i<arr2.length;i++){
            let item2=arr2[i];
            if(item1.id==item2.id){
                isFind=true;
                arr2.splice(i, 1);
                break;
            }
        }
        if(!isFind){
            arr1_dif.push(item1);
        }
    }
    return {
        para1_dif:arr1_dif,
        para2_dif:arr2
    }
}