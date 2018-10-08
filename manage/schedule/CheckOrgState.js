const Models = require('../models/index.js');
module.exports = class CheckOrgState extends Models {
    constructor(){
        super();
    }
    async run(){
        let orgList=await this.query('SELECT id FROM sys_organization WHERE id > 1',{type:this.QueryTypes.SELECT});
        let checkR=[];
        for(let i=0;i<orgList.length;i++){
            let org=orgList[i];
            let r = await this.checkOrgState(org.id);
            if(r.state){
                await this.query('UPDATE sys_organization SET isFoul=2  WHERE id = ? LIMIT 1',{
                    replacements:[org.id],
                    type:this.QueryTypes.INSERT
                })
            }else{
                await this.query('UPDATE sys_organization SET isFoul=1  WHERE id = ? LIMIT 1',{
                    replacements:[org.id],
                    type:this.QueryTypes.INSERT
                })
            }
            checkR.push(`${org.id}号机构数据检查结果：${JSON.stringify(r)}`);
        }
        checkR.forEach(item=>{
            console.log(item);
        })
    }
    /**
     * 检查机构是否存在违规行为*/
    async checkOrgState(id){
        let baseNum=5;//分母基数
        let result={
            state:true,
            type:[],//1表示手机归属地异常，2表示用户操作作业检查时间异常，3表示引入用户年级异常，0表示无异常
        }
        //查询机构下的用户的归属地和机构归属的统计结果
        let sql1=`
            SELECT 
            nor.total AS nor_num,
            err.total AS err_num,
            nor.total+err.total AS all_num
            FROM (
            SELECT COUNT(*) AS total
            FROM app_user AS u
            INNER JOIN app_third_user AS th
            ON u.\`id\`=th.\`app_user_id\`
            INNER JOIN sys_org_school AS m
            ON m.\`app_school_id\`=u.\`school_id\`
            INNER JOIN sys_phone AS p
            ON th.uid=p.phone_num
            INNER JOIN sys_organization AS o
            ON m.\`sys_org_id\`=o.\`id\`
            WHERE m.\`sys_org_id\`=2
            AND th.\`app_type\`=1
            AND p.\`province\`=o.\`province\`
            ) AS nor,
            (
            SELECT COUNT(*) AS total
            FROM app_user AS u
            INNER JOIN app_third_user AS th
            ON u.\`id\`=th.\`app_user_id\`
            INNER JOIN sys_org_school AS m
            ON m.\`app_school_id\`=u.\`school_id\`
            INNER JOIN sys_phone AS p
            ON th.uid=p.phone_num
            INNER JOIN sys_organization AS o
            ON m.\`sys_org_id\`=o.\`id\`
            WHERE m.\`sys_org_id\`=${id}
            AND th.\`app_type\`=1
            AND p.\`province\`!=o.\`province\`
            ) AS err
        `
        let r1=await this.query(sql1,{type:this.QueryTypes.SELECT});
        if(r1[0].all_num>baseNum && r1[0].err_num/r1[0].all_num > 0.5){
            result.type.push({
                code:1,
                total:r1[0].all_num,
                err:r1[0].err_num
            });
            result.state=false;
        }
        //查询该机构操作3次作业检查以上的用户中，操作时间小于90秒的人
        let sql2=`
            SELECT
            COUNT(r.id) AS total_err,
            m.\`sys_org_id\`
            FROM (
                SELECT 
                COUNT(r.id) AS err_num,
                r.id,
                r.school_id
                FROM (
                    SELECT
                    u.\`id\`,
                    u.\`school_id\`,
                    TIMESTAMPDIFF(SECOND,u.create_time,l.create_time) AS ds
                    FROM app_user AS u
                    LEFT JOIN app_handle_logs AS l
                    ON l.\`app_user_id\`=u.\`id\`
                    WHERE
                    l.\`app_handle_id\` IN (3,6)
                ) AS r
                WHERE r.ds<90
                GROUP BY r.id
            ) AS r
            INNER JOIN sys_org_school AS m
            ON m.\`app_school_id\`=r.school_id
            WHERE m.\`sys_org_id\`=${id}
            AND r.err_num>=3
        `
        let r2=await this.query(sql2,{type:this.QueryTypes.SELECT});
        //查询该机构所有操作有三次的用户
        let sql3=`
            SELECT 
            COUNT(r.id)
            FROM (
            SELECT
            u.\`id\`,
            u.\`school_id\`,
            COUNT(l.\`id\`) AS total
            FROM app_user AS u
            LEFT JOIN app_handle_logs AS l
            ON l.\`app_user_id\`=u.\`id\`
            AND l.\`app_handle_id\` IN (3,6)
            GROUP BY u.\`id\`
            ) AS r
            INNER JOIN sys_org_school AS m
            ON m.\`app_school_id\`=r.school_id
            WHERE r.total>=3
            AND m.\`sys_org_id\`=${id}
        `
        let r3=await this.query(sql3,{type:this.QueryTypes.SELECT});
        if(r3[0].total>baseNum && r2[0].total_err/r3[0].total > 0.5){
            result.type.push({
                code:2,
                total:r3[0].total,
                err:r2[0].total_err
            });
            result.state=false;
        }
        //查询该机构下的年级在3-6年级的用户数量
        let sql4=`
            SELECT
            COUNT(u.\`id\`) AS total
            FROM app_user AS u
            INNER JOIN app_school_classes AS scm
            ON u.\`school_classes_id\`=scm.\`id\`
            INNER JOIN app_classes AS c
            ON c.\`id\`=scm.\`app_classes_id\`
            INNER JOIN sys_org_school AS m
            ON m.\`app_school_id\`=u.\`school_id\`
            WHERE m.\`sys_org_id\`=${id}
            AND c.\`year\` IN (2016,2015,2014,2013)
        `
        let r4=await this.query(sql4,{type:this.QueryTypes.SELECT});
        //查询该机构下有年级的总用户数
        let sql5=`
            SELECT
            COUNT(u.\`id\`) AS total
            FROM app_user AS u
            INNER JOIN app_school_classes AS scm
            ON u.\`school_classes_id\`=scm.\`id\`
            INNER JOIN app_classes AS c
            ON c.\`id\`=scm.\`app_classes_id\`
            INNER JOIN sys_org_school AS m
            ON m.\`app_school_id\`=u.\`school_id\`
            WHERE m.\`sys_org_id\`=${id}
        `
        let r5=await this.query(sql5,{type:this.QueryTypes.SELECT});
        if(r5[0].total >baseNum && r4[0].total/r5[0].total < 0.5){
            result.type.push({
                code:3,
                total:r5[0].total,
                err:r5[0].total-r4[0].total
            });
            result.state=false;
        }
        return result
    }
}