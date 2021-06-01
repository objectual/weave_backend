import express from "express";
import { userRouter } from "../app/http/controller/api.v1/user";
import { userAdminRouter } from "../app/http/controller/api.v1/user/admin";
import { BrowserMiddleware } from "../app/http/middleware/browser";
const app = express();

app.use("/auth", BrowserMiddleware.restrictedBrowser(), userRouter);

app.use("/users", BrowserMiddleware.restrictedBrowser(), userRouter);

app.use("/users/admin", BrowserMiddleware.restrictedBrowser(), userAdminRouter);

module.exports = app;