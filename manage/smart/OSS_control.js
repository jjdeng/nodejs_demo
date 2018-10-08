const OSS = require('ali-oss');
const OSS_config=require('../config/OSS.config');
const client = new OSS(OSS_config);
/**
 * put 上传文件，remotePath 远程路径，localPath 本地路径
 * get 下载文件，remotePath 远程路径，localPath 本地路径
 * remove 删除单个文件 remotePath 远程路径
 * listDir 遍历目录 dir 需要遍历的目录,traverse 是否要递归遍历所有，默认是false
 * copy 远程复制文件 oldPath 远程旧路径，newPath 远程新路径
 * move 远程移动文件 oldPath 远程旧路径, newPath 远程新路径
 * deleteFiles 批量删除文件 arr 删除文件的路径数组*/
async function put (remotePath,localPath) {
    try {
        remotePath=remotePath.replace(/^\//,'');
        let result = await client.put(remotePath, localPath);
        let r={};
        for(let attr in result){
            if(attr!='res'){
                r[attr]=result[attr];
            }
        }
        return r;
    } catch (err) {
        throw err
    }
}
async function get (remotePath,localPath) {
    try {
        remotePath=remotePath.replace(/^\//,'');
        let result = await client.get(remotePath,localPath);
        let r={};
        for(let attr in result){
            if(attr!='res'){
                r[attr]=result[attr];
            }
        }
        return r;
    } catch (err) {
        throw err
    }
}
async function remove (remotePath) {
    try {
        remotePath=remotePath.replace(/^\//,'');
        let result = await client.delete(remotePath);
        let r={};
        for(let attr in result){
            if(attr!='res'){
                r[attr]=result[attr];
            }
        }
        console.log(result);
        return r;
    } catch (err) {
        throw err
    }
}
async function listDir(dir,traverse=false){
    try {
        dir=dir.replace(/^\//,'');
        let result = await client.list({
            prefix: dir,
            delimiter:traverse? '':'/'
        });
        let r={};
        for(let attr in result){
            if(attr!='res'){
                r[attr]=result[attr];
            }
        }
        return r;
    }catch (err){
        throw err
    }
}
async function copy (oldPath,newPath) {
    try {
        // 两个Bucket之间拷贝
        oldPath=oldPath.replace(/^\//,'');
        newPath=newPath.replace(/^\//,'');
        let result = await client.copy(newPath,oldPath);
        let r={};
        for(let attr in result){
            if(attr!='res'){
                r[attr]=result[attr];
            }
        }
        return r;
    } catch (err) {
        throw err
    }
}
async function move (oldPath,newPath) {
    try {
        // 两个Bucket之间拷贝
        oldPath=oldPath.replace(/^\//,'');
        newPath=newPath.replace(/^\//,'');
        await client.copy(newPath,oldPath);
        await client.delete(oldPath);
    } catch (err) {
        throw err
    }
}
async function deleteFiles (arr=[]) {
    try {
        for(let i=0;i<arr.length;i++){
            arr[i]=arr[i].replace(/^\//,'');
        }
        let result = await client.deleteMulti(arr);
        let r={};
        for(let attr in result){
            if(attr!='res'){
                r[attr]=result[attr];
            }
        }
        console.log(r);
        return r;
    } catch (err) {
        throw err
    }
}
async function isFile(remotePath) {
    try {
        remotePath=remotePath.replace(/^\//,'');
        let re=/\/$/;
        if(re.test(remotePath)){
            return false;
        }
        let result = await client.list({
            prefix: remotePath,
            delimiter:'/'
        });
        if(result.objects){
            if(result.objects[0].name===remotePath){
                return true;
            }else{
                return false;
            }
        }else{
            return false;
        }
    }catch (err){
        throw err
    }
}
async function isFolder(remotePath) {
    try {
        remotePath=remotePath.replace(/^\//,'');
        let re=/\/$/;
        if(re.test(remotePath)){
            return false;
        }
        let result = await client.list({
            prefix: remotePath,
            delimiter:'/'
        });
        if(result.prefixes){
            if(result.prefixes[0]===remotePath+'/'){
                return true;
            }else{
                return false;
            }
        }else{
            return false;
        }
    }catch (err){
        throw err
    }
}
module.exports={
    put,
    get,
    remove,
    listDir,
    copy,
    move,
    deleteFiles,
    isFile,
    isFolder
};