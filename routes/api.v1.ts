
import express from "express";
const app = express();

import AuthRoutes from "../app/http/controller/api.v1/auth";
import GroupRoutes from "../app/http/controller/api.v1/group";
import FolderRoutes from "../app/http/controller/api.v1/folder";
import ConnectionRoutes from "../app/http/controller/api.v1/connection";
import EventRoutes from "../app/http/controller/api.v1/events";
import UserRoutes from "../app/http/controller/api.v1/user";
import UserAdminRoutes from "../app/http/controller/api.v1/user/admin";
import { AuthMiddleware } from "../app/http/middleware/auth";
import { RoleMiddleware } from "../app/http/middleware/role";

class ApiRoutes {
    get routes() {
        app.use("/auth", new AuthRoutes().routes);

        app.use("/users", AuthMiddleware.isAuthenticated(), new UserRoutes().routes);

        app.use("/connections", AuthMiddleware.isAuthenticated(), AuthMiddleware.isApproved(), new ConnectionRoutes().routes);

        app.use("/events", AuthMiddleware.isAuthenticated(), AuthMiddleware.isApproved(), new EventRoutes().routes);

        app.use("/group", AuthMiddleware.isAuthenticated(), AuthMiddleware.isApproved(), new GroupRoutes().routes);
       
        app.use("/folder", AuthMiddleware.isAuthenticated(), AuthMiddleware.isApproved(), new FolderRoutes().routes);

        app.use("/users/admin", AuthMiddleware.isAuthenticated(), AuthMiddleware.isApproved(), RoleMiddleware.isAdmin(), new UserAdminRoutes().routes);
        return app
    }
}


Object.seal(ApiRoutes);
export default ApiRoutes;