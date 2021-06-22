import express from "express";
import { authRouter } from "../app/http/controller/api.v1/auth";
import { userRouter } from "../app/http/controller/api.v1/user";
import { userAdminRouter } from "../app/http/controller/api.v1/user/admin";
import { connectionRouter } from "../app/http/controller/api.v1/connection";
import { AuthMiddleware } from "../app/http/middleware/auth";
import { RoleMiddleware } from "../app/http/middleware/role";
import { eventsRouter } from "../app/http/controller/api.v1/events";
const app = express();

app.use("/auth", authRouter);

app.use("/users", AuthMiddleware.isAuthenticated(), userRouter);

app.use("/connections", AuthMiddleware.isAuthenticated(), AuthMiddleware.isApproved(), connectionRouter);

app.use("/events", AuthMiddleware.isAuthenticated(), AuthMiddleware.isApproved(), eventsRouter);

app.use("/events/admin", AuthMiddleware.isAuthenticated(), AuthMiddleware.isApproved(), RoleMiddleware.isAdmin(), connectionRouter);

app.use("/users/admin", AuthMiddleware.isAuthenticated(), AuthMiddleware.isApproved(), RoleMiddleware.isAdmin(), userAdminRouter);

module.exports = app;