import { Sender } from "../../../services/sender.service";
import * as _ from "lodash"
import { FolderService } from "../../../services/folder.service";
import { IFolderCreate } from "../../../models/folder.model";
import { ILocation } from "../../../models/location.model";
import { Request, Response } from "express";
export class Folders {
    async getFolders(req: Request, res: Response) {
        try {
            // let limit = _.toInteger(req.query.limit);
            // let page = _.toInteger(req.query.page);
            const folderService = new FolderService();
            // if (req.query.id != null && req.query.id != undefined && req.query.id != "") {
            //     let event  = await eventService.findOne({ id: req.query.id })
            //     Sender.send(res, { success: true, data: event, status: 200 })
            // } 
            // else {
                let orQuery = { userId: req['user'].id }
                
                // let { events, count } = await eventService.findWithLimit({ OR: orQuery }, limit, page)
                let event = await folderService.find(orQuery)
                Sender.send(res, { success: true, data: event, status: 200 })
            // }
        } catch (e) {
            Sender.errorSend(res, { success: false, msg: e.message, status: 500 })
        }
    }

    async createFolder(req: Request, res: Response) {
        try {
            let body:IFolderCreate  = {
                name: req.body.name,
                owner: { connect: { id: req['user'].id } },
            }
            const folderService = new FolderService();
            console.log(body);

            let event = await folderService.create(body);
            Sender.send(res, { success: true, data: event, status: 201, msg: "Folder created" })
        } catch (e) {
            Sender.errorSend(res, { success: false, msg: e.message, status: 500 })
        }
    }

    // async updateEvent(req: Request, res: Response) {
    //     try {
    //         let location: ILocation = {
    //             address: req.body.address,
    //             lat: req.body.lat,
    //             long: req.body.long,
    //         }
    //         let body: IEventUpdate = {
    //             title: req.body.title,
    //             description: req.body.description,
    //             from: new Date(req.body.from),
    //             to: new Date(req.body.to),
    //             location: { connectOrCreate: { create: location, where: { lat_long: { lat: location.lat, long: location.long } } } },
    //             members: {},
    //         }
    //         if (req.body.members != null && req.body.members.connect != null && req.body.members.connect.id.length > 0) {
    //             body.members['connect'] = req.body.members.connect.id.map(x => { return { id: x } })
    //         } else if (req.body.members != null && req.body.members.disconnect != null && req.body.members.disconnect.id.length > 0) {
    //             body.members['disconnect'] = req.body.members.disconnect.id.map(x => { return { id: x } })
    //         }
    //         const eventService = new EventService();
    //         let event = await eventService.update({ id: req.params.id }, body);
    //         Sender.send(res, { success: true, data: event, status: 201, msg: "Event updated" })
    //     } catch (e) {
    //         Sender.errorSend(res, { success: false, msg: e.message, status: 500 })
    //     }
    // }

    // async deleteEvent(req: Request, res: Response) {
    //     try {
    //         const eventService = new EventService();
    //         let event = await eventService.findOne({ id: req.params.id, userId: req['user'].id })
    //         if (event == null) {
    //             Sender.errorSend(res, { success: false, status: 409, msg: "Only event owner can remove event" })
    //             return;
    //         }
    //         let unblocked = await eventService.delete({ id: req.params.id, userId: req['user'].id })
    //         Sender.send(res, { success: true, data: unblocked, msg: "Event removed", status: 200 })
    //     } catch (error) {
    //         Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
    //     }
    // }
}