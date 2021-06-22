import express from 'express';
export const userRouter = express.Router();

import { User } from './user.controller'
import { Uploader } from "../../../../constants/uploader";
import { ValidationMiddleware } from '../../../middleware/validation';
import { CacheMiddleware } from '../../../middleware/cache';
import { AuthMiddleware } from '../../../middleware/auth';

let user_controller = new User();

userRouter.get('/', AuthMiddleware.isApproved(), ValidationMiddleware.blockedUsersList(), CacheMiddleware.userSearch(), user_controller.get)

userRouter.put('/', ValidationMiddleware.validateUserUpdate(), user_controller.update)

userRouter.post('/uploader', ValidationMiddleware.validateUserImageCount(), Uploader.fields([{ name: "images" }]), user_controller.uploader)

userRouter.delete('/images/remove', user_controller.imageRemove)

userRouter.get('/images/:id', user_controller.getImages)
