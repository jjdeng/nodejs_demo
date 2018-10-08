module.exports = {
    apps : [
        {
            "name":"sys_manage_dev",
            "script": "./server.js",
            "output": "./logs/out.log",
            "error": "./logs/err.log",
            "log":'./logs/combined.outerr.log',
            "log_date_format" : "YYYY-MM-DD HH:mm:ss Z",
	        "merge_logs":true
        }
    ]
}
