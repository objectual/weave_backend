import express from 'express';
export const userAdminRouter = express.Router();
 
import { ValidationMiddleware } from '../../../../middleware/validation';
import { User } from './user.admin.controller'

let user_controller = new User();

userAdminRouter.get('/', user_controller.get)

userAdminRouter.post('/:id', ValidationMiddleware.validateAdminUserUpdate(), user_controller.update);