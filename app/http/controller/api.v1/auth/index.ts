import express from 'express';
import { AuthMiddleware } from '../../../middleware/auth';
import { ValidationMiddleware } from '../../../middleware/validation';
import { Authentication } from './auth.controller'
export const authRouter = express.Router();

const user_controller = new Authentication();

authRouter.post('/', ValidationMiddleware.validateUserLogin(), user_controller.login);

authRouter.post('/verify', ValidationMiddleware.validateUserVerify(), user_controller.verify);

authRouter.post('/logout', AuthMiddleware.isAuthenticated(), user_controller.logout)