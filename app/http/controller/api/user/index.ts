import express from 'express';
import { AuthenticationMiddleware } from '../../../middleware/auth';
export const userRouter = express.Router();

import { RoleMiddleware } from '../../../middleware/role';
import { ValidationMiddleware } from '../../../middleware/validation';
import { Uploader } from '../../../../constants/multer';
import { User } from './user.controller'

let user_controller = new User();
let validation_controller = new ValidationMiddleware()
let auth_controller = new AuthenticationMiddleware()
// let role_controller = new RoleMiddleware()
// / validation_controller.validateUserRegistration(), upload.fields([{ name: "image" }]), user_controller.register
userRouter.post('/register', validation_controller.validateUserRegistration(), Uploader.fields([{ name: "img" }]), user_controller.register);

// userRouter.post('/login', validation_controller.validateUserLogin(), user_controller.login);

// userRouter.post("/social_signin", validation_controller.validateSocialLogin(), user_controller.socialLogin)

// userRouter.get('/get', auth_controller.isAuthenticated(), user_controller.get)