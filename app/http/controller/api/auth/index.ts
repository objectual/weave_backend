import express from 'express';
import { AuthenticationMiddleware } from '../../../middleware/auth';
export const userRouter = express.Router();

import { upload } from "../../../../constants/multer";
import { RoleMiddleware } from '../../../middleware/role';
import { ValidationMiddleware } from '../../../middleware/validation';
import { Authentication } from './auth.controller'
import { CacheMiddleware } from '../../../middleware/cache';

let user_controller = new Authentication();
let validation_controller = new ValidationMiddleware()
let cache_controller = new CacheMiddleware()
let auth_controller = new AuthenticationMiddleware()
let role_controller = new RoleMiddleware()

userRouter.post('/login', validation_controller.validateUserLogin(), user_controller.login);

userRouter.post('/verify', validation_controller.validateUserVerify(), user_controller.verify);

userRouter.post('/logout', auth_controller.isAuthenticated(), user_controller.logout)