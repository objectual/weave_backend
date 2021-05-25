import expess from "express";
import { connectionRouter } from "../app/http/controller/api/connection";
import { connectionAdminRouter } from "../app/http/controller/api/connection/admin";
import { userRouter } from "../app/http/controller/api/user";
import { userAdminRouter } from "../app/http/controller/api/user/admin";
const app = expess();


app.use("/users", userRouter);
app.use("/connections", connectionRouter);

app.use("/users/admin", userAdminRouter);
app.use("/connections/admin", connectionAdminRouter);

module.exports = app;