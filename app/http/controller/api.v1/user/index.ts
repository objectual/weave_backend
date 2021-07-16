import express from 'express';
const router = express.Router();

import { User } from './user.controller'
import { Uploader } from "../../../../constants/uploader";
import { CacheMiddleware } from '../../../middleware/cache';
import { AuthMiddleware } from '../../../middleware/auth';
import { ConnectionValidationMiddleware } from '../../../validators/connection.validate';
import { UserValidationMiddleware } from '../../../validators/user.validate';

class UserRoutes {
    get routes() {
        router.get('/', AuthMiddleware.isApproved(), ConnectionValidationMiddleware.blockedUsersList(), CacheMiddleware.userSearch(), new User().get)

        router.put('/', UserValidationMiddleware.validateUserUpdate(), new User().update)

        router.post('/uploader', UserValidationMiddleware.validateUserImageCount(), Uploader.fields([{ name: "images" }]), new User().uploader)

        router.delete('/images/remove', new User().imageRemove)

        router.get('/images/:id', new User().getImages)
        return router
    }
}
Object.seal(UserRoutes);
export default UserRoutes;