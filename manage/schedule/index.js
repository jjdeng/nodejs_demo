const schedule=require('node-schedule');
const ClassesSchedule=require('./ClassesSchedule');
const CheckOrgState=require('./CheckOrgState');
const checkOrgState = new CheckOrgState();
module.exports=()=>{
    schedule.scheduleJob({hour:3}, function(){
        checkOrgState.run();
    });
    //定时生成班级信息 每年的01-01 00:00:00
    schedule.scheduleJob('0 0 0 1 9 *', function(){
        let year = new Date().getFullYear();
        let classesSchedule = new ClassesSchedule();
        classesSchedule.runCreateClasses(year);
    });
};