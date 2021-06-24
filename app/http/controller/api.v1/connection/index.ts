import express from 'express';
import { ConnectionValidationMiddleware } from '../../../validators/connection.validate';
const router = express.Router();
import { Connection } from './connection.controller'

class ConnectionRoutes {
    get routes() {
        router.get('/friends', new Connection().getFriends)

        router.get('/friends/requests', new Connection().getFriendRequests)

        router.get('/friends/pending', new Connection().getFriendsPendingApproval)

        router.post('/friends', ConnectionValidationMiddleware.blockedUsersList(), ConnectionValidationMiddleware.validateFriendRequest(), new Connection().sendFriendRequest)

        router.put('/friends/:id', ConnectionValidationMiddleware.validateFriendRequestUpdate(), new Connection().updateFriendRequest)

        router.delete('/friends/:id', new Connection().deleteFriendRequest)

        router.get('/blocked', new Connection().getBlockList)

        router.post('/blocked', ConnectionValidationMiddleware.validateBlockedRequest(), new Connection().blockUser)

        router.delete('/blocked/:id', new Connection().unblockUser)

        return router;
    }
}

Object.seal(ConnectionRoutes);
export = ConnectionRoutes;