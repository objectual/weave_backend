import express from 'express';
export const eventsRouter = express.Router(); 
import { ValidationMiddleware } from '../../../middleware/validation';
import { Events } from './events.controller'

let events_controller = new Events();

eventsRouter.get('/', events_controller.getEvents)

eventsRouter.post('/', ValidationMiddleware.blockedUsersList(), ValidationMiddleware.validateEventCreate(), events_controller.createEvent)

eventsRouter.put('/:id', ValidationMiddleware.validateEventUpdate(), events_controller.updateEvent)

eventsRouter.delete('/:id', events_controller.deleteEvent)
