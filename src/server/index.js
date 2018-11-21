
const Koa = require("koa");
const KoaRouter = require("koa-router");
const KoaStatic = require("koa-static");
const Sqlite3 = require('sqlite3').verbose();
const Moment = require("moment");
const colors = require("colors");
const process = require("process");
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

//Promise封装SQL查询接口
function select (db, sql) {
    let args = Object.entries(arguments)
                     .map(item => item[1])
                     .slice(2);
    return new Promise((resolve, reject) => {
        db.all(sql, args, (err, result) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(result);
            }
        });
    });
}

async function getTableList (db) {
    return select(db, "select * from sqlite_master where type = 'table' order by name");
}

async function pullTable (db, table) {
    return select(db, `select * from ${ table }`);
}

//主函数
async function main () {
    try {
        let app = new Koa();
        let router = new KoaRouter();
        let db = new Sqlite3.Database("wechat.db");
        db.serialize(function() {
            db.run("PRAGMA key = 'eea9ad9';");
            db.run("PRAGMA cipher_migrate;");
        });
        router.get("/table", async (ctx, next) => {
            try {
                let code = 200;
                let list = await getTableList(db);
                ctx.status = code;
                ctx.body = {
                    code: code,
                    data: list,
                    msg: "查询成功",
                };
            }
            catch (e) {
                setCtx500(ctx);   
            }
        });
        router.get("/table/:name", async (ctx, next) => {
            try {
                let code = 200;
                let list = await pullTable(db, ctx.params.name);
                ctx.status = code;
                ctx.body = {
                    code: code,
                    data: list,
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

main();

// db.close();