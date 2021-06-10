import express from 'express';
import { AuthenticationMiddleware } from '../../../middleware/auth';
export const connectionRouter = express.Router();

import { RoleMiddleware } from '../../../middleware/role';
import { ValidationMiddleware } from '../../../middleware/validation';
import { Connection } from './connection.controller'
import { CacheMiddleware } from '../../../middleware/cache';

let connection_controller = new Connection();
let validation_controller = new ValidationMiddleware()
let auth_controller = new AuthenticationMiddleware()
let role_controller = new RoleMiddleware()

connectionRouter.get('/friends', auth_controller.isAuthenticated(), connection_controller.getFriends)

connectionRouter.get('/friends/requests', auth_controller.isAuthenticated(), connection_controller.getFriendRequests)

connectionRouter.get('/friends/pending', auth_controller.isAuthenticated(), connection_controller.getFriendsPendingApproval)

connectionRouter.post('/friends', auth_controller.isAuthenticated(), validation_controller.validateFriendRequest(), connection_controller.sendFriendRequest)

connectionRouter.put('/friends/:id', auth_controller.isAuthenticated(), validation_controller.validateFriendRequestUpdate(), connection_controller.updateFriendRequest)

connectionRouter.delete('/friends/:id', auth_controller.isAuthenticated(), connection_controller.deleteFriendRequest)

connectionRouter.get('/blocked', auth_controller.isAuthenticated(), connection_controller.getBlockList)

connectionRouter.post('/blocked', auth_controller.isAuthenticated(), validation_controller.validateBlockedRequest(), connection_controller.blockUser)

connectionRouter.delete('/blocked/:id', auth_controller.isAuthenticated(), connection_controller.unblockUser)