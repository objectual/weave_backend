import { Sender } from "../../../services/sender.service";
import * as _ from "lodash"
import { EventService } from "../../../services/event.service";
import { IEventCreate, IEventUpdate } from "../../../models/event.model";
import { ILocation } from "../../../models/location.model";
import { Request, Response } from "express";
export class Events {
    async getEvents(req:Request, res:Response) {
        try {
            let limit = _.toInteger(req.query.limit);
            let page = _.toInteger(req.query.page);
            const eventService = new EventService();
            let orQuery = [
                { userId: req['user'].id },
                {
                    members: {
                        some: {
                            id: {
                                contains: req['user'].id,
                            },
                        },
                    }
                }
            ]
            let { events, count } = await eventService.findWithLimit({ OR: orQuery }, limit, page)
            Sender.send(res, { success: true, data: events, count, page, pages: Math.ceil(count / limit), status: 200 })
        } catch (e) {
            Sender.errorSend(res, { success: false, msg: e.message, status: 500 })
        }
    }

    async createEvent(req:Request, res:Response) {
        try {
            let location: ILocation = {
                address: req.body.address,
                lat: req.body.lat,
                long: req.body.long,
            }
            let body: IEventCreate = {
                title: req.body.title,
                description: req.body.description,
                from: new Date(req.body.from),
                to: new Date(req.body.to),
                location: { connectOrCreate: { create: location, where: { lat_long: { lat: location.lat, long: location.long } } } },
                owner: { connect: { id: req['user'].id } },
                members: { connect: req.body.members.map(x => { return { id: x } }) },
            }
            const eventService = new EventService();
            let event = await eventService.create(body);
            Sender.send(res, { success: true, data: event, status: 201, msg: "Event created" })
        } catch (e) {
            Sender.errorSend(res, { success: false, msg: e.message, status: 500 })
        }
    }

    async updateEvent(req:Request, res:Response) {
        try {
            let location: ILocation = {
                address: req.body.address,
                lat: req.body.lat,
                long: req.body.long,
            }
            let body:IEventUpdate = {
                title: req.body.title,
                description: req.body.description,
                from: new Date(req.body.from),
                to: new Date(req.body.to),
                location: { connectOrCreate: { create: location, where: { lat_long: { lat: location.lat, long: location.long } } } },
                members: {},
            }
            if (req.body.members != null && req.body.members.connect != null && req.body.members.connect.id.length > 0) {
                body.members['connect'] = req.body.members.connect.id.map(x => { return { id: x } })
            } else if (req.body.members != null && req.body.members.disconnect != null && req.body.members.disconnect.id.length > 0) {
                body.members['disconnect'] = req.body.members.disconnect.id.map(x => { return { id: x } })
            }
            console.log(body)
            const eventService = new EventService();
            let event = await eventService.update({ id: req.params.id }, body);
            Sender.send(res, { success: true, data: event, status: 201, msg: "Event updated" })
        } catch (e) {
            Sender.errorSend(res, { success: false, msg: e.message, status: 500 })
        }
    }

    async deleteEvent(req:Request, res:Response) {
        try {
            const eventService = new EventService();
            let event = await eventService.findOne({ id: req.params.id, userId: req['user'].id })
            if (event == null) {
                Sender.errorSend(res, { success: false, status: 409, msg: "Only event owner can remove event" })
                return;
            }
            let unblocked = await eventService.delete({ id: req.params.id, userId: req['user'].id })
            Sender.send(res, { success: true, data: unblocked, msg: "Event removed", status: 200 })
        } catch (error) {
            Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
}