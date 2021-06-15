import express from 'express';
export const userRouter = express.Router();

import { User } from './user.controller'
import { AuthMiddleware } from '../../../middleware/auth';
import { Uploader } from "../../../../constants/uploader";
import { RoleMiddleware } from '../../../middleware/role';
import { ValidationMiddleware } from '../../../middleware/validation';
import { CacheMiddleware } from '../../../middleware/cache';

let user_controller = new User();

userRouter.get('/', AuthMiddleware.isAuthenticated(), ValidationMiddleware.blockedUsersList(), CacheMiddleware.userSearch(), user_controller.get)

userRouter.put('/', AuthMiddleware.isAuthenticated(), ValidationMiddleware.validateUserUpdate(), user_controller.update)

userRouter.post('/uploader', AuthMiddleware.isAuthenticated(), ValidationMiddleware.validateUserImageCount(), Uploader.fields([{ name: "images" }]), user_controller.uploader)

userRouter.delete('/images/remove', AuthMiddleware.isAuthenticated(), user_controller.imageRemove)

userRouter.get('/images/:id', AuthMiddleware.isAuthenticated(), user_controller.getImages)
