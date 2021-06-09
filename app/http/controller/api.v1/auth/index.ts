import express from 'express';
import { AuthenticationMiddleware } from '../../../middleware/auth';
export const authRouter = express.Router();
import { ValidationMiddleware } from '../../../middleware/validation';
import { Authentication } from './auth.controller' 
let user_controller = new Authentication();
let validation_controller = new ValidationMiddleware() 
let auth_controller = new AuthenticationMiddleware() 

authRouter.post('/', validation_controller.validateUserLogin(), user_controller.login);

authRouter.post('/verify', validation_controller.validateUserVerify(), user_controller.verify);

authRouter.post('/logout', auth_controller.isAuthenticated(), user_controller.logout)