
const Koa = require("koa");
const KoaRouter = require("koa-router");
const KoaStatic = require("koa-static");
const Sqlite3 = require('sqlite3').verbose();
const Moment = require("moment");
const colors = require("colors");
const fs = require("fs");

//服务端端口
const serverPort = 10241;

//404中间件
function hold404 (ctx, next) {
    let code = 404;
    ctx.status = code;
    ctx.body = {
        code: code,
        data: null,
        msg: "资源不存在",
    };
}

//500中间件
function setCtx500 (ctx) {
    let code = 500;
    ctx.status = code;
    ctx.body = {
        code: code,
        data: null,
        msg: "服务器内部错误",
    };   
}

//记录每一次请求信息到日志文件的中间件
function holdAll (ctx, next) {
    let path = ctx.path;
    let ip = ctx.ip;
    fs.appendFile("log.txt", `${ ip } ${ Moment(new Date).format("YYYY-MM-DD HH:mm:ss") } ${ path }\r\n`, err => { });
    return next();
}

//主函数
async function main () {
    try {
        let app = new Koa();
        let router = new KoaRouter();
        let db = new Sqlite3.Database("endb.db");
        db.serialize(() => {
            db.run("PRAGMA key = 'eea9ad9';");
            db.run("PRAGMA cipher_migrate;");
            db.each("SELECT content FROM message limit 10 offset 30000;", function(err, row) {
                console.log(row.content);
            });
        });
        //根据QQ号查询关系图接口
        router.get("/tables", async (ctx, next) => {
            try {
                let code = 200;
                ctx.status = code;
                ctx.body = {
                    code: code,
                    data: "ok",
                    msg: "查询成功",
                };
            }
            catch (e) {
                setCtx500(ctx);   
            }
        });

        app
            .use(KoaStatic(__dirname + "/www"))
            // .use(holdAll)
            .use(router.routes())
            .use(hold404);

        app.listen(serverPort);
        console.log(`OK！现在后端服务已经启动，工作在 ${ serverPort } 端口，如需一直开启服务请不要关闭此进程...`.green);
    }
    catch (e) {
        console.error(e.message);
    }
}

// main();





let db = new Sqlite3.Database("wechat.db");
db.serialize(function() {
    db.run("PRAGMA key = 'eea9ad9';");
    db.run("PRAGMA cipher_migrate;");
    db.each("SELECT content FROM message limit 10 offset 30000;", function(err, row) {
        console.log(row.content);
    });
    db.each("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;", function(err, row) {
        console.log(row.name);
    });
});

db.close();