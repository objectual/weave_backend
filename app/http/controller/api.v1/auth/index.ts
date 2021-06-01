import express from 'express';
import { AuthenticationMiddleware } from '../../../middleware/auth';
export const userRouter = express.Router();
import { ValidationMiddleware } from '../../../middleware/validation';
import { Authentication } from './auth.controller' 
let user_controller = new Authentication();
let validation_controller = new ValidationMiddleware() 
let auth_controller = new AuthenticationMiddleware() 

userRouter.post('/login', validation_controller.validateUserLogin(), user_controller.login);

userRouter.post('/verify', validation_controller.validateUserVerify(), user_controller.verify);

userRouter.post('/logout', auth_controller.isAuthenticated(), user_controller.logout)