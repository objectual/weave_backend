import express from 'express';
import { AuthenticationMiddleware } from '../../../../middleware/auth';
export const connectionAdminRouter = express.Router();

import { RoleMiddleware } from '../../../../middleware/role';
import { ValidationMiddleware } from '../../../../middleware/validation';
import { Connection } from './connection.admin.controller'
import { CacheMiddleware } from '../../../../middleware/cache';

let connection_controller = new Connection();
let validation_controller = new ValidationMiddleware()
let cache_controller = new CacheMiddleware()
let auth_controller = new AuthenticationMiddleware()
let role_controller = new RoleMiddleware()

connectionAdminRouter.get('/friends/:id', auth_controller.isAuthenticated(), role_controller.isAdmin(),  connection_controller.getFriends)

connectionAdminRouter.get('/blocked/:id', auth_controller.isAuthenticated(), role_controller.isAdmin(), connection_controller.getFriends) 
