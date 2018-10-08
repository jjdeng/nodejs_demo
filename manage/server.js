const path = require('path');
let cors = require('cors');
const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bodyParser = require('body-parser');
const http = require('http');
const winston = require('winston');
const expressWinston = require('express-winston');
const formidable = require('formidable');
const Models = require('./models/index');
const schedule = require('./schedule/index');
var SequelizeStore = require('connect-session-sequelize')(session.Store);
const modelsdb = new Models();
let app = express();
process.on('unhandledRejection', (reason, p) => {
    console.log("Unhandled Rejection at: Promise ", p, " reason: ", reason);
    // application specific logging, throwing an error, or other logic here
});
// 设置端口号
app.set('port', 8002);
app.use(cors({
    preflightContinue: false, credentials: true, origin: function (origin, cb) {
        cb(null, origin);
    }
}));
// 托管静态文件(可根据需求改写)
app.use("/", express.static(path.join(__dirname,'../server/www')))
app.use("/", express.static(path.join(__dirname,'/upload')))

// 限制数据大小
app.use(bodyParser.json({limit: '50mb'}))
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
app.use(cookieParser());
let extendDefaultFields = function(defaults, session){
    return {
        data: defaults.data,
        expires: defaults.expires,
        userId: session.userId,
    };
}
let myStore = new SequelizeStore({
    db: modelsdb,
    table: 'sys_sessions',
    extendDefaultFields: extendDefaultFields
});
app.use(session({
    secret: '12345_sec',
    name: 'SERVER_SIDE_V_AUTH',
    store:myStore,
    cookie: { maxAge: 1000 * 60 * 60*24*30,httpOnly:false}, //有效时间设为60min
    resave: false,
    saveUninitialized: false
}));
myStore.sync();
app.all('*', function(req, res, next) {//req HTTP请求对象，resHTTP响应对象
    // res.header("Access-Control-Allow-Origin", "*")
    // res.header("Access-Control-Allow-Origin", "*")//接受跨域
    // res.header("Access-Control-Allow-Headers", "X-Requested-With")
    // res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS")
    // res.header("X-Powered-By",' 3.2.1')
    res.header("Content-Type", "application/json;charset=utf-8")
    next();
});
// 接口路由配置
var apiRouter = require('./router/index');
// 打印request信息以及reponse信息
expressWinston.requestWhitelist.push('body');
expressWinston.responseWhitelist.push('body');
app.use(expressWinston.logger({
    transports: [
        new (winston.transports.Console)({
            json: true,
            colorize: true
        })
    ]
}))
apiRouter(router);
app.use("/sysManage", router);
app.use(expressWinston.errorLogger({
    transports: [
        new winston.transports.Console({
            json: true,
            colorize: true
        })
    ]
}));
//启动及端口
http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'))
});
//执行定时计划
schedule();