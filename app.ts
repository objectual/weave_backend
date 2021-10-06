'use strict';
import express from "express";
import session from 'express-session';
import RateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import { Request, Response } from "express"
import xss from "xss";

import path from "path";
import cors from "cors";

import busboyBodyParser from 'busboy-body-parser';
import cookieParser from "cookie-parser";
import appRoot from 'app-root-path'

import fs from "fs"
import config from "config"
import logger from "morgan";

const RedisStore = require('connect-redis')(session)
import { RedisService } from './app/cache/redis.service';
import { BrowserMiddleware } from './app/http/middleware/browser';
import ApiRoutes from "./routes/api.v1";

var app = express();
app.use(cors());

app.use(session({
    store: new RedisStore({ client: RedisService.connectCache() }),
    secret: process.env.PASSPHRASE,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        // if true only transmit cookie over https but will not work if your node server is not on HTTP2
        secure: false,//config.get("environment") == 'production' ? true : false,
        httpOnly: true, // if true prevent client side JS from reading the cookie 
        maxAge: 168 * 60 * 60 * 1000 // 48 hours session max age in milliseconds
    }
}))

// Express TCP requests parsing
app.use(busboyBodyParser({ limit: '10mb', multi: true }));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser());

// Body satinization for XSS
app.use(function (req, res, next) {
    var sanatizeBody = JSON.stringify(req.body);
    var html = xss(sanatizeBody, {
        stripIgnoreTag: true, // filter out all HTML not in the whilelist
        stripIgnoreTagBody: ["script"], // the script tag is a special case, we need
        // to filter out its content
    });
    const reqbody = JSON.parse(html);
    req.body = reqbody;
    next();
});


// create a write stream (in append mode) for system logger
var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })
app.use(logger('common', { stream: accessLogStream }))

// Static rendering
app.use(express.static(path.join(__dirname, "views")));
app.set("view engine", "ejs");

// Rate limiter
// Enable if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
app.set('trust proxy', 1);

// Storing in memCache
const slD = new slowDown({
    prefix: "slowDown",
    windowMs: 5 * 60 * 1000, //how long to keep records of requests in memory.
    delayAfter: 50,
    delayMs: 500, // begin adding 500ms of delay per request above 100:
});
const rtL = new RateLimit({
    max: 100,
    prefix: "rateLimit",
    skipFailedRequests: false, // Do not count failed requests (status >= 400)
    skipSuccessfulRequests: false, // Do not count successful requests (status < 400)
    windowMs: 5 * 60 * 1000,
    expiry: 300,
    resetExpiryOnChange: true,
    handler: function (req: Request, res: Response /*, next*/) {
        res.status(429).render(path.join(appRoot.path, "views/error/429.ejs"), { error: "Too any requests from your IP, please try again later" });
        return;
    },
    onLimitReached: function (req: Request, res: Response, optionsUsed) {
        res.status(429).render(path.join(appRoot.path, "views/error/429.ejs"), { error: "Going a little too fast. Your IP has been blocked for 5 mins" });
        return;
    }
});
// Route definitions
app.use('/cache', slD, rtL, BrowserMiddleware.restrictedBrowser(), require('./app/cache'))
app.use("/console", slD, rtL, require('./routes/console'));
app.use("/api/v1", slD, rtL, BrowserMiddleware.restrictedBrowser(), new ApiRoutes().routes);
app.post('/reset-limit', function (req: Request, res: Response) {
    slD.resetKey(req.ip)
    rtL.resetKey(req.ip)
    res.redirect(req.header('Referer') || '/');
});
require("./routes/web")(app);

module.exports = app;