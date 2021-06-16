import express from 'express'; 
export const eventsRouter = express.Router(); 
import { ValidationMiddleware } from '../../../../middleware/validation';
import { Events } from './events.admin.controller'

let events_controller = new Events();

eventsRouter.get('/', events_controller.getEvents)

eventsRouter.put('/:id', ValidationMiddleware.validateFriendRequestUpdate(), events_controller.updateEvent)

eventsRouter.delete('/:id', events_controller.deleteEvent)
