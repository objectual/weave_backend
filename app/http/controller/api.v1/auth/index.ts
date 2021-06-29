import express from 'express';
import { AuthMiddleware } from '../../../middleware/auth';
import { UserValidationMiddleware } from '../../../validators/user.validate';
import { Authentication } from './auth.controller'
const router = express.Router();

class AuthRoutes {
    get routes() {
        router.post('/', UserValidationMiddleware.validateUserLogin(), new Authentication().login);

        router.get('/jwt', AuthMiddleware.isAuthenticated(), new Authentication().jwt);

        router.post('/verify', UserValidationMiddleware.validateUserVerify(), new Authentication().verify);

        router.delete('/logout', AuthMiddleware.isAuthenticated(), new Authentication().logout)
        return router;
    }
}

Object.seal(AuthRoutes);
export = AuthRoutes;