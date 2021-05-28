'use strict';
const express = require("express");
const session = require('express-session');
const path = require("path");
const cookieParser = require("cookie-parser"); 
const logger = require("morgan");
const cors = require("cors");
const passport = require('passport');
const fs = require("fs") 

const RedisStore = require('connect-redis')(session)
import { RedisService } from './app/cache/redis.service';
const redis = require("redis")

var app = express();
app.use(cors());

if (process.env.NODE_ENV == "production") {
    app.use(session({
        store: new RedisStore({ client:  redis.createClient() }),
        secret: process.env.PASSPHRASE,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: true, // if true only transmit cookie over https
            httpOnly: true, // if true prevent client side JS from reading the cookie 
            maxAge: 48 * 60 * 60 * 1000 // 48 hours session max age in miliseconds
        }
    }))
} else {
    app.use(session({
        store: new RedisStore({ client: redis.createClient()  }),
        secret: process.env.PASSPHRASE,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false, // if true only transmit cookie over https
            httpOnly: false, // if true prevent client side JS from reading the cookie 
            maxAge: 48 * 60 * 60 * 1000 // 48 hours session max age in miliseconds
        }
    }))
}

app.use(passport.initialize());
app.use(passport.session());

// Express TCP requests parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser());

// create a write stream (in append mode) for system logger
var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })
app.use(logger('common', { stream: accessLogStream }))

// Static rendering
app.use(express.static(path.join(__dirname, "views")));
app.set("view engine", "ejs");

// Route definitions
app.use('/cache', require('./app/cache'))
app.use("/console", require('./routes/console'));

app.use("/api", require("./routes/api"));
require("./routes/web")(app);

passport.serializeUser(function (user, cb) {
    cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
    cb(null, obj);
});
module.exports = app;