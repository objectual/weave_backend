import { Sender } from "../../../services/sender.service";
import * as _ from "lodash"
import { FolderService } from "../../../services/folder.service";
import { IFolderCreate,IFolderUpdate } from "../../../models/folder.model";
import { Request, Response } from "express";
export class Folders {
    async getFolders(req: Request, res: Response) {
        try {
            const folderService = new FolderService();
                let orQuery = { userId: req['user'].id }
                let event = await folderService.find(orQuery)
                Sender.send(res, { success: true, data: event, status: 200 })
        } catch (e) {
            Sender.errorSend(res, { success: false, msg: e.message, status: 500 })
        }
    }

    async createFolder(req: Request, res: Response) {
        try {
            let body:IFolderCreate  = {
                name: req.body.name,
                owner: { connect: { id: req['user'].id } },
                group: {},
                user:{}
            }
            if(req.body.group){
                if (req.body.group != null && req.body.group.connect != null && req.body.group.connect.id.length > 0) {
                    body.group['connect'] = req.body.group.connect.id.map(x => { return { id: x } })
                }
            }   
            if(req.body.user){
                if (req.body.user != null && req.body.user.connect != null && req.body.user.connect.id.length > 0) {
                    body.user['connect'] = req.body.user.connect.id.map(x => { return { id: x } })
                }
            }     
            const folderService = new FolderService();
            let event = await folderService.create(body);
            Sender.send(res, { success: true, data: event, status: 201, msg: "Folder created" })
        } catch (e) {
            Sender.errorSend(res, { success: false, msg: e.message, status: 500 })
        }
    }

    async updateFolder(req: Request, res: Response) {
        try {
        
            let body: IFolderUpdate = {
                group: {},
                user:{}
            }
            if(req.body.group){
            if (req.body.group != null && req.body.group.connect != null && req.body.group.connect.id.length > 0) {
                body.group['connect'] = req.body.group.connect.id.map(x => { return { id: x } })
            } else if (req.body.group != null && req.body.group.disconnect != null && req.body.group.disconnect.id.length > 0) {
                body.group['disconnect'] = req.body.group.disconnect.id.map(x => { return { id: x } })
            }
        }   
        if(req.body.user){
            if (req.body.user != null && req.body.user.connect != null && req.body.user.connect.id.length > 0) {
                body.user['connect'] = req.body.user.connect.id.map(x => { return { id: x } })
            } else if (req.body.user != null && req.body.user.disconnect != null && req.body.user.disconnect.id.length > 0) {
                body.user['disconnect'] = req.body.user.disconnect.id.map(x => { return { id: x } })
            }
        }            
            const folderService = new FolderService();
            let event = await folderService.update({ id: req.params.id }, body);
            Sender.send(res, { success: true, data: event, status: 201, msg: "Folder updated" })
        } catch (e) {
            Sender.errorSend(res, { success: false, msg: e.message, status: 500 })
        }
    }

    async deleteFolder(req: Request, res: Response) {
        try {
            const folderService = new FolderService();
            let unblocked = await folderService.delete({ id: req.params.id, userId: req['user'].id })
            Sender.send(res, { success: true, data: unblocked, msg: "folder removed", status: 200 })
        } catch (error) {
            Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
}