import express from 'express';
const router = express.Router();
import { Events } from './events.admin.controller'

class EventAdminRoutes {
    get routes() {
        router.get('/', new Events().getEvents)

        router.delete('/:id', new Events().deleteEvent)

        return router;
    }
}

Object.seal(EventAdminRoutes);
export = EventAdminRoutes;