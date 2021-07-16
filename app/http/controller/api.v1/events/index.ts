import express from 'express';
import { EventValidationMiddleware } from '../../../validators/event.validate';
const router = express.Router();
import { Events } from './events.controller'
class EventRoutes {
    get routes() {
        router.get('/', new Events().getEvents)

        router.post('/', EventValidationMiddleware.validateEventCreate(), new Events().createEvent)

        router.put('/:id', EventValidationMiddleware.validateEventUpdate(), new Events().updateEvent)

        router.delete('/:id', new Events().deleteEvent)

        return router;
    }
}
Object.seal(EventRoutes);
export default EventRoutes;