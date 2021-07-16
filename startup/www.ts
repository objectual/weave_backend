#!/usr/bin/env node
console.info(`
██     ██ ███████  █████  ██    ██ ███████ 
██     ██ ██      ██   ██ ██    ██ ██      
██  █  ██ █████   ███████ ██    ██ █████   
██ ███ ██ ██      ██   ██  ██  ██  ██      
 ███ ███  ███████ ██   ██   ████   ███████
`)
/**
 * Module dependencies.
 */
require('dotenv').config()
var app = require("../app")
import { Request, Response } from "express"
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
import http from 'http';
import moment from 'moment';
import fs from 'fs';
import path from "path";
import appRoot from "app-root-path";

/**
 * Get port from environment and store in Express.
 */
var port = normalizePort(process.env.PORT || "3000");
app.set("port", port);


// production error handler
// no stacktraces leaked to user
app.use(function (err, req: Request, res: Response, next) {
    fs.appendFile("access.log", `⌚ ${moment().format("DD-MM-YYYY hh:mm:ss a")} Uncaught Exception: ${err.stack} \n`, () => { });
    if (process.env.NODE_ENV == "production") {
        res.status(500).render(path.join(appRoot.path, "views/error/500.ejs"), { error: "Something went wrong!" })
    } else {
        res.status(500).render(path.join(appRoot.path, "views/error/500.ejs"), { error: err.message })
    }
});

/**
 * Create HTTP server.
 */
var server = http.createServer(app);
require("../socks")(server) // Connecting all socks to app
/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port, function () {
    connectDatabase().then(() => {
        console.info(`✔️ Server Started (listening on PORT : ${port})`);
        console.info(`⌚`, moment().format("DD-MM-YYYY hh:mm:ss a"));
    }).catch(() => {
        server.close();
        process.exit();
    })
});

// run inside `async` function
async function connectDatabase() {
    return new Promise(async (resolve, reject) => {
        try {
            await prisma.$connect()
            prisma.$disconnect()
            console.info(`✔️ Database Safely Connected with (${process.env.DATABASE_URL})`);
            return resolve(true)
        } catch (err) {
            console.info(`⌚`, moment().format("DD-MM-YYYY hh:mm:ss a"));
            console.error("❗️ Could not connect to database...", err);
            return reject(false)
        }
    })
}

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
    var port = parseInt(val, 10);
    if (isNaN(port)) {
        return val;
    }
    if (port >= 0) {
        return port;
    }
    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */
function terminate(server, options = { coredump: false, timeout: 500 }) {
    // Exit function
    const exit = (code) => {
        options.coredump ? process.abort() : process.exit(code);
    };

    return (code, reason) => (err, promise) => {
        if (err && err instanceof Error) {
            // Log error information, use a proper logging library here :)
            fs.appendFileSync("access.log", `⌚ ${moment().format("DD-MM-YYYY hh:mm:ss a")} ${err.stack} \n`);
            console.log(err.message, err.stack);
        }

        // Attempt a graceful shutdown
        // server.close(exit);
        // setTimeout(exit, options.timeout).unref();
    };
}

function exitHandler(options, exitCode) {
    terminate(server, {
        coredump: false,
        timeout: 500,
    });
    console.log('⚠️ Gracefully shutting down');
    server.close();
    process.exit();
}

process.on("uncaughtException", (err) => {
    fs.appendFile("access.log", `⌚ ${moment().format("DD-MM-YYYY hh:mm:ss a")} Uncaught Exception: ${err.stack} \n`, () => { });
    console.log(`Uncaught Exception: ${err}`);
});
process.on("unhandledRejection", (reason, promise) => {
    fs.appendFile(
        "access.log",
        `⌚ ${moment().format("DD-MM-YYYY hh:mm:ss a")} Unhandled rejection, reason: ${reason} \n`,
        () => { }
    );
    console.log("Unhandled rejection at", promise, `reason: ${reason}`);
});
process.on('SIGINT', exitHandler.bind(null, { exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));