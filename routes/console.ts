import express from "express";
const app = express();
import * as appRoot from 'app-root-path'
import { BrowserMiddleware } from "../app/http/middleware/browser";
const config = require('config')
const path = require("path");

app.get("/health", BrowserMiddleware.restrictedBrowser(),function (req, res) {
  console.log({
    origin: config.get('origin'),
    environment: process.env.NODE_ENV,
    port: process.env.PORT,
    sql_db: process.env.DATABASE_URL,
    m_db_cluster: process.env.MONGO_CLUSTER,
    m_db_name: config.get('db.name'),
    r_host: process.env.REDIS_HOST,
    r_port: process.env.REDIS_PORT
  });
  res.json({
    success: true,
  });
});

app.get("/logs", BrowserMiddleware.restrictedBrowser(), function (req, res) {
  res.sendFile(path.join(appRoot.path, 'access.log'));
});

module.exports = app;
