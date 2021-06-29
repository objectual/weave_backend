import express from 'express';
const router = express.Router();
import { Share } from './share.controller'
class ShareRoutes {
    get routes() {
        router.get('/user/:id', new Share().user)

        router.get('/event/:id', new Share().event)

        return router;
    }
}
Object.seal(ShareRoutes);
export = ShareRoutes;