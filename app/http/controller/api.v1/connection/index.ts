import express from 'express';
export const connectionRouter = express.Router();
import { AuthMiddleware } from '../../../middleware/auth';
import { ValidationMiddleware } from '../../../middleware/validation';
import { Connection } from './connection.controller'

let connection_controller = new Connection();

connectionRouter.get('/friends', AuthMiddleware.isAuthenticated(), connection_controller.getFriends)

connectionRouter.get('/friends/requests', AuthMiddleware.isAuthenticated(), connection_controller.getFriendRequests)

connectionRouter.get('/friends/pending', AuthMiddleware.isAuthenticated(), connection_controller.getFriendsPendingApproval)

connectionRouter.post('/friends', AuthMiddleware.isAuthenticated(), ValidationMiddleware.blockedUsersList(), ValidationMiddleware.validateFriendRequest(), connection_controller.sendFriendRequest)

connectionRouter.put('/friends/:id', AuthMiddleware.isAuthenticated(), ValidationMiddleware.validateFriendRequestUpdate(), connection_controller.updateFriendRequest)

connectionRouter.delete('/friends/:id', AuthMiddleware.isAuthenticated(), connection_controller.deleteFriendRequest)

connectionRouter.get('/blocked', AuthMiddleware.isAuthenticated(), connection_controller.getBlockList)

connectionRouter.post('/blocked', AuthMiddleware.isAuthenticated(), ValidationMiddleware.validateBlockedRequest(), connection_controller.blockUser)

connectionRouter.delete('/blocked/:id', AuthMiddleware.isAuthenticated(), connection_controller.unblockUser)
