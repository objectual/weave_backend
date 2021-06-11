import express from 'express';
export const userAdminRouter = express.Router();

import { AuthMiddleware } from '../../../../middleware/auth'; 
import { RoleMiddleware } from '../../../../middleware/role';
import { ValidationMiddleware } from '../../../../middleware/validation';
import { User } from './user.admin.controller'

let user_controller = new User();

userAdminRouter.get('/', AuthMiddleware.isAuthenticated(), RoleMiddleware.isAdmin(), user_controller.get)

userAdminRouter.post('/:id', AuthMiddleware.isAuthenticated(), RoleMiddleware.isAdmin(), ValidationMiddleware.validateAdminUserUpdate(), user_controller.update);