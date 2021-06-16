import express from 'express';
export const connectionRouter = express.Router(); 
import { ValidationMiddleware } from '../../../middleware/validation';
import { Connection } from './connection.controller'

let connection_controller = new Connection();

connectionRouter.get('/friends', connection_controller.getFriends)

connectionRouter.get('/friends/requests', connection_controller.getFriendRequests)

connectionRouter.get('/friends/pending', connection_controller.getFriendsPendingApproval)

connectionRouter.post('/friends', ValidationMiddleware.blockedUsersList(), ValidationMiddleware.validateFriendRequest(), connection_controller.sendFriendRequest)

connectionRouter.put('/friends/:id', ValidationMiddleware.validateFriendRequestUpdate(), connection_controller.updateFriendRequest)

connectionRouter.delete('/friends/:id', connection_controller.deleteFriendRequest)

connectionRouter.get('/blocked', connection_controller.getBlockList)

connectionRouter.post('/blocked', ValidationMiddleware.validateBlockedRequest(), connection_controller.blockUser)

connectionRouter.delete('/blocked/:id', connection_controller.unblockUser)
