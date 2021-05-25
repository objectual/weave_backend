import express from 'express';
import { AuthenticationMiddleware } from '../../../middleware/auth';
export const userRouter = express.Router();

import { upload } from "../../../../constants/multer";
import { RoleMiddleware } from '../../../middleware/role';
import { ValidationMiddleware } from '../../../middleware/validation';
import { User } from './user.controller'
import { CacheMiddleware } from '../../../middleware/cache';

let user_controller = new User();
let validation_controller = new ValidationMiddleware()
let cache_controller = new CacheMiddleware()
let auth_controller = new AuthenticationMiddleware()
let role_controller = new RoleMiddleware()

userRouter.post('/', auth_controller.isAuthenticated(), role_controller.isUser(), validation_controller.validateUserUpdate(), upload.fields([{ name: "image" }]), user_controller.update);

userRouter.get('/', cache_controller.userSearch(), user_controller.get)

userRouter.post('/register', validation_controller.validateUserRegistration(), user_controller.register);

userRouter.post('/social/register', validation_controller.validateUserRegistration(), user_controller.social_register);

userRouter.post('/login', validation_controller.validateUserLogin(), user_controller.login);

userRouter.post('/verify', validation_controller.validateUserVerify(), user_controller.verify);

userRouter.post('/logout', auth_controller.isAuthenticated(), user_controller.logout)