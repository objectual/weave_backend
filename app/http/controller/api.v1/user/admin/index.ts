import express from 'express';
import { UserValidationMiddleware } from '../../../../validators/user.validate';
const router = express.Router();

import { User } from './user.admin.controller'

class UserAdminRoutes {
    get routes() {
        router.get('/', new User().get)

        router.post('/:id', UserValidationMiddleware.validateAdminUserUpdate(), new User().update);

        return router;
    }
}

Object.seal(UserAdminRoutes);
export = UserAdminRoutes;