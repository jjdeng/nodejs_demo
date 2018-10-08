/**
 * @apiDefine NOT_LOGIN
 *
 * @apiError (Error:0x000001) NOT_LOGIN 尚未登录或登录超时
 *
 * @apiErrorExample Error-Response:
 *  {
 *      "code": "0x000001",
 *      "msg": "尚未登录或登录超时！..."
 *      "data": null,
 *      "result":'failed'
 *  }
 */

/**
 * @apiDefine DB_ERROR
 *
 * @apiError (Error:0x000002) DB_ERROR 数据库执行出错
 *
 * @apiErrorExample Error-Response:
 *  {
 *      "code": "0x000002",
 *      "msg": "数据库执行出错！..."
 *      "data": null,
 *      "result":'failed'
 *  }
 */

/**
 * @apiDefine POWER_ERROR
 *
 * @apiError (Error:0x000003) POWER_ERROR 没有权限
 *
 * @apiErrorExample Error-Response:
 *  {
 *      "code": "0x000003",
 *      "msg": "没有权限！..."
 *      "data": null,
 *      "result":'failed'
 *  }
 */

/**
 * @apiDefine BAD_REQUEST
 *
 * @apiError (Error:0x000005) BAD_REQUEST 缺少请求参数或者请求参数类型有误导致报错
 *
 * @apiErrorExample Error-Response:
 *  {
 *      "code": "0x000005",//缺少请求参数或者请求参数类型有误导致报错
 *      "msg": "错误的请求！..."
 *      "data": null,
 *      "result":'failed'
 *  }
 */


module.exports = {
	"SUCCESS" : {"code": "0x000000", "msg": "操作成功！"},
	"NOT_LOGIN" : {"code": "0x000001", "msg": "尚未登录或登录超时！"},
	"DB_ERROR" : {"code": "0x000002", "msg": "数据库执行出错！"},
	"POWER_ERROR" : {"code": "0x000003", "msg": "没有权限！"},
    "OTHER_ERROR" : {"code": "0x000004", "msg": "自定义错误！"},
	"BAD_REQUEST":{"code":"0x000005","msg":"错误的请求！"},
    "SERVER_ERROR":{"code":"0x000006","msg":"服务器执行出了错误！"},
}
