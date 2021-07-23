import { Request, Response } from "express"
import { ChatRoomService } from "../../../services/chat.service";
import { Sender } from "../../../services/sender.service";
import * as _ from "lodash"
import { IRoomCreate, IRoomUpdate } from "../../../models/room.model";

export class Chat {
    async get(req: Request, res: Response) {
        try {
            let limit = _.toInteger(req.query.limit);
            let page = _.toInteger(req.query.page);
            const roomService = new ChatRoomService();
            if (req.query.id != null && req.query.id != undefined && req.query.id != "") {
                let event = await roomService.findOne({ id: req.query.id })
                Sender.send(res, { success: true, data: event, status: 200 })
            } else {
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
                let { rooms, count } = await roomService.findWithLimit({ OR: orQuery }, limit, page)
                Sender.send(res, { success: true, data: rooms, count, page, pages: Math.ceil(count / limit), status: 200 })
            }
        } catch (e) {
            Sender.errorSend(res, { success: false, msg: e.message, status: 500 })
        }
    }
    async post(req: Request, res: Response) {
        try {
            let body: IRoomCreate = {
                name: req.body.name,
                image: req.body.image,
                owner: { connect: { id: req['user'].id } },
                members: { connect: req.body.members.map(x => { return { id: x } }) },
            }
            const roomService = new ChatRoomService();
            let event = await roomService.create(body);
            Sender.send(res, { success: true, data: event, status: 201, msg: "Room created" })
        } catch (e) {
            Sender.errorSend(res, { success: false, msg: e.message, status: 500 })
        }
    }
    async patch(req: Request, res: Response) {
        try {
            let body: IRoomUpdate = {
                name: req.body.name,
                image: req.body.image,
                members: {},
            }
            if (req.body.members != null && req.body.members.connect != null && req.body.members.connect.id.length > 0) {
                body.members['connect'] = req.body.members.connect.id.map(x => { return { id: x } })
            } else if (req.body.members != null && req.body.members.disconnect != null && req.body.members.disconnect.id.length > 0) {
                body.members['disconnect'] = req.body.members.disconnect.id.map(x => { return { id: x } })
            }
            const roomService = new ChatRoomService();
            let room = await roomService.update({ id: req.params.id }, body);
            Sender.send(res, { success: true, data: room, status: 201, msg: "Room updated" })
        }
        catch (error) {
            Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
    async delete(req: Request, res: Response) {
        try {
            const roomService = new ChatRoomService();
            let room = await roomService.findOne({ id: req.params.id, userId: req['user'].id })
            if (room == null) {
                Sender.errorSend(res, { success: false, status: 409, msg: "Only event owner can remove event" })
                return;
            }
            let unblocked = await roomService.delete({ id: req.params.id, userId: req['user'].id })
            Sender.send(res, { success: true, data: unblocked, msg: "Room removed", status: 200 })
        }
        catch (error) {
            Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
}