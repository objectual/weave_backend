import express from 'express';
import { AuthenticationMiddleware } from '../../../middleware/auth';
export const userRouter = express.Router();

import { Uploader } from "../../../../constants/multer";
import { RoleMiddleware } from '../../../middleware/role';
import { ValidationMiddleware } from '../../../middleware/validation';
import { User } from './user.controller'
import { CacheMiddleware } from '../../../middleware/cache';

let user_controller = new User();
let validation_controller = new ValidationMiddleware()
let cache_controller = new CacheMiddleware()
let auth_controller = new AuthenticationMiddleware()
let role_controller = new RoleMiddleware()

userRouter.get('/', cache_controller.userSearch(), user_controller.get)

userRouter.post('/', auth_controller.isAuthenticated(), role_controller.isUser(), validation_controller.validateUserUpdate(),  user_controller.update)

userRouter.post('/uploader', auth_controller.isAuthenticated(), role_controller.isUser(), Uploader.fields([{ name: "image" }]), user_controller.update)
