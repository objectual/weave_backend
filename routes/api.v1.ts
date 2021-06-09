import express from "express";
import { authRouter } from "../app/http/controller/api.v1/auth";
import { userRouter } from "../app/http/controller/api.v1/user";
import { userAdminRouter } from "../app/http/controller/api.v1/user/admin";
import { connectionRouter } from "../app/http/controller/api.v1/connection";
import { connectionAdminRouter } from "../app/http/controller/api.v1/connection/admin";
const app = express();

app.use("/auth", authRouter);

app.use("/users", userRouter);

app.use("/users/admin", userAdminRouter);

app.use("/connections", connectionRouter);

app.use("/connections/admin", connectionAdminRouter);

module.exports = app;