import express, { Request, Response } from "express";
const app = express();
import * as appRoot from "app-root-path";
import { BrowserMiddleware } from "../app/http/middleware/browser";
import { AuthMiddleware } from "../app/http/middleware/auth";
const config = require("config");
const path = require("path");

app.get("/health", function (req: Request, res: Response) {
  console.log({
    origin: config.get("origin"),
    environment: process.env.NODE_ENV,
    port: process.env.PORT,
    sql_db: process.env.DATABASE_URL,
    m_db_cluster: process.env.MONGO_CLUSTER,
    m_db_name: config.get("db.name"),
    r_host: process.env.REDIS_HOST,
    r_port: process.env.REDIS_PORT,
  });
  res.json({
    success: true,
  });
});

app.get(
  "/session",
  BrowserMiddleware.restrictedBrowser(),
  AuthMiddleware.isAuthenticated(),
  function (req: Request, res: Response) {
    res.json({
      success: true,
      data: req["user"],
      raw: {
        existing: true,
        approved: req["user"].data.profile.approved,
      },
    });
  }
);

app.get(
  "/logs",
  BrowserMiddleware.restrictedBrowser(),
  function (req: Request, res: Response) {
    res.sendFile(path.join(appRoot.path, "access.log"));
  }
);

module.exports = app;
