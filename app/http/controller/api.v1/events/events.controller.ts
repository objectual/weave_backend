import { Sender } from "../../../services/sender.service";
import * as _ from "lodash"
import { EventService } from "../../../services/event.service";
export class Events {
    async getEvents(req, res) {
        try {
            let limit = _.toInteger(req.query.limit);
            let page = _.toInteger(req.query.page);
            const eventService = new EventService();
            let orQuery = [
                { userId: req.user.id, approved: true },
                { friendId: req.user.id, approved: true },
            ]
            let { events, count } = await eventService.findWithLimit({ OR: orQuery }, limit, page)
            Sender.send(res, { success: true, data: events, count, page, pages: Math.ceil(count / limit), status: 200 })

        } catch (e) {
            Sender.errorSend(res, { success: false, msg: e.messages, status: 500 })
        }
    }

    async createEvent(req, res) {
        try {
        } catch (e) {
            Sender.errorSend(res, { success: false, msg: e.messages, status: 500 })
        }
    }

    updateEvent(req, res) {
        try {

        } catch (e) {
            Sender.errorSend(res, { success: false, msg: e.messages, status: 500 })
        }
    }

    deleteEvent(req, res) {
        try {

        } catch (e) {
            Sender.errorSend(res, { success: false, msg: e.messages, status: 500 })
        }
    }
}