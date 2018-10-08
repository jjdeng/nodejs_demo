const fs        = require('fs');
const path      = require('path');
const  Sequelize = require('sequelize');
//获取命令行传进来的参数
const args = process.argv.splice(2);
const book_ids=args[0];
const type=args[1];
if(!book_ids){
    console.error('failed:book_id必须要传入！');
    return
}
if(!type){
    console.error('failed:导入目标必须要传入！');
    return
}
run(book_ids,type).then((r)=>{
    console.log(r);
    process.exit();
}).catch(e=>{
    console.error(e);
    process.exit();
});









async function run(book_ids,type){
    console.log('开始数据导入！');
    /**
     * data_lock_path 锁书数据目录
     * oss_book_path 正式服book OSS目录
     * web01_images web01 本地服务器 book 目录
     * web02_images web02 本地服务器 book 目录
     * develop_images 开发环境，测试环境本地服务器目录**/
    const data_lock_path=path.join(__dirname,'../../data_lock');
    const book_id_arr=book_ids.split(',');
    const mySqls=['book.txt','describe.txt','directory.txt','page_answer.txt','pages.txt','topic.txt'];//需要导入的sql数据
    if(type==1){//导入到开发环境
        const develop_images='/mnt/data/app_v2_develop/manage/upload/images'
        //1、运行环境检测
        try {
            fs.accessSync(data_lock_path);
            fs.accessSync(develop_images);
        }catch (e) {
            throw e;
        }
        const Modal=new Sequelize('xxy_db','root','xuexiyouMima123()',{
            host:'47.107.40.191',
            dialect: 'mysql',
            timezone: 'Asia/Shanghai'
        });
        await importData(book_id_arr,mySqls,Modal,data_lock_path,[develop_images]);
        return '数据导入到开发服成功！'
    }else if(type==2){//导入到正式环境
        const oss_book_path='/mnt/oss-book/images';
        const web01_images='/mnt/web01_images';
        const web02_images='/mnt/web02_images';
        //1、运行环境检测
        try {
            fs.accessSync(data_lock_path);
            fs.accessSync(oss_book_path);
            fs.accessSync(web01_images);
            fs.accessSync(web02_images);
        }catch (e) {
            throw e;
        }
        const Modal=new Sequelize('xxy_db','root','newxuexiyouMima123()',{
            host:'rm-wz9obb91e6t1dzuc14o.mysql.rds.aliyuncs.com',
            dialect: 'mysql',
            timezone: 'Asia/Shanghai'
        });
        await importData(book_id_arr,mySqls,Modal,data_lock_path,[oss_book_path,web01_images,web02_images]);
        return '数据导入到正式服成功！'
    }else{
        return '不接受的操作类型！'
    }
}

async function importData(book_id_arr,mySqls,Modal,data_lock_path,filesDataPaths) {
    const total_book=book_id_arr.length; //需要完成导入的书的总数量
    let book_objs=[];
    for(let i=0;i<total_book;i++){
        book_objs.push({
            id:book_id_arr[i],
            sql:{
                state:0,//0表示未导入，1导入成功，2导入失败
            },
            images:{
                state:0,
            }
        })
    }
    let sql_success=0;
    let sql_failed=0;
    for(let i=0;i<total_book;i++){
        let book_id=book_id_arr[i];
        console.log(`sql:${book_id}号书sql开始导入----------------------------------------`)
        try {
            await insertBook.call(Modal,data_lock_path+'/'+book_id+'/sql',mySqls);
            book_objs[i].sql.state=1;
            sql_success++;
            console.log(`sql:${book_id}号书sql结束导入----------------------------------------`)
        }catch (e) {
            book_objs[i].sql.state=2;
            book_objs[i].sql.err=e;
            sql_failed++;
            console.log(`sql:${book_id}号书sql导入出错----------------------------------------`)
            console.log(e);
        }
    }
    console.log(`sql:${total_book}本sql导入完成,成功${sql_success}本,失败${sql_failed}本-----------------------`)
    let files_success=0;
    let files_failed=0;
    for(let i=0;i<total_book;i++){
        let {id,sql}=book_objs[i];
        console.log(`files:${id}号书文件开始导入----------------------------------------`)
        if(sql.state===1){
            try {
                for(let i=0;i<filesDataPaths.length;i++){
                    copydir(`${data_lock_path}/${id}`,`${filesDataPaths[i]}/${id}`);
                }
                book_objs[i].images.state=1;
                files_success++;
            }catch (e) {
                console.log(`files:${id}号书文件导入失败----------------------------------------`)
                console.log(e);
            }
        }else{
            book_objs[i].images.state=2;
            files_failed++;
            book_objs[i].images.err={msg:'因为导入sql失败，所以不导入files'};
            console.log(`files:${id}号书文件导入失败----------------------------------------`)
            console.log('Error：因为导入sql失败，所以不导入files');
        }
    }
    console.log(`files:${total_book}本文件导入完成,成功${files_success}本,失败${files_failed}本-----------------------`)
    console.log(JSON.stringify(book_objs));
}

async function insertBook(sql_path,sql_need){
    let sqls_txt=fs.readdirSync(sql_path).filter((str)=>{
        if(sql_need.indexOf(str)===-1){
            return false
        }else{
            return true
        }
    });
    let sqls=[];
    sqls_txt.forEach(item=>{
        // REPLACE
        let sql=`LOAD DATA LOCAL INFILE ?
            REPLACE
            INTO TABLE \`${item.split('.')[0]}\`
            FIELDS TERMINATED BY ','
            OPTIONALLY ENCLOSED BY '"'
            LINES TERMINATED BY '\\N';`
        sqls.push({sql:sql,replacements:[`${sql_path}/${item}`]})
    })
    await this.transaction(async t=>{
        for(let i=0;i<sqls.length;i++){
            await this.query(sqls[i].sql,{transaction:t,replacements:sqls[i].replacements})
        }
    });
}


/**
 * 复制目录
 */
function copydir(src,dst) {
    mkdirsSync(dst);
    let paths=fs.readdirSync(src);
    paths.forEach(path=>{
        let _path=src+'/'+path;
        let t_path=dst+'/'+path;
        let st=fs.statSync(_path);
        if(st.isDirectory()){
            copydir(_path,t_path);
        }else if(st.isFile()){
            fs.writeFileSync(t_path, fs.readFileSync(_path));
            console.log(`文件复制完成：${_path}`);
        }
    })
}
/**
 * 检测目录是否存在，不存在就创建
 */
function mkdirsSync(dirname) {
    try{
        fs.accessSync(dirname)
        return true;
    }catch (e) {
        if(e.code==='ENOENT'){
            if (mkdirsSync(path.dirname(dirname))) {
                fs.mkdirSync(dirname);
                return true;
            }
        }else{
            throw e
        }
    }
}