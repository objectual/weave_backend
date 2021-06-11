import express from 'express';
export const connectionAdminRouter = express.Router();

import { AuthMiddleware } from '../../../../middleware/auth';
import { RoleMiddleware } from '../../../../middleware/role';
import { Connection } from './connection.admin.controller'

let connection_controller = new Connection();

connectionAdminRouter.get('/friends/:id', AuthMiddleware.isAuthenticated(), RoleMiddleware.isAdmin(), connection_controller.getFriends)

connectionAdminRouter.get('/blocked/:id', AuthMiddleware.isAuthenticated(), RoleMiddleware.isAdmin(), connection_controller.getFriends)
