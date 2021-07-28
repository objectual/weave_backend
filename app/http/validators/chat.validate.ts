"use strict";
import Joi from "joi";
import * as _ from "lodash";
import moment from 'moment';
import compose from "composable-middleware"
import { Sender } from "../services/sender.service";
import { PrismaClient } from "@prisma/client";
import { IUser } from "../models/user.model";
import { Request, Response } from "express"
import { IRoomCreate, IRoomUpdate } from "../models/room.model";
import { ChatRoomService } from "../services/chat.service";
import { IImages } from "../models/images.model";

interface RoomCreateData extends IRoomCreate {
    "name": string,
    "image": { create: { type: IImages['type'], cloudinaryId: IImages['cloudinaryId'], path: IImages['path'] } },
}

interface RoomUpdateData extends IRoomUpdate {
    "name": string,
    "image": { update: { cloudinaryId: IImages['cloudinaryId'], path: IImages['path'] } },
}
class Validator {
    constructor() { }
    //************************ VALIDATE ROOM CREATE DATA ***********************//
    protected validateCreateRoom(data: RoomCreateData) {
        const schema = Joi.object().keys({
            name: Joi.string().required(),
            description: Joi.string().required(),
            admins: Joi.array().items(Joi.string()),
            members: Joi.array().items(Joi.string())
        });
        return Joi.validate(data, schema);
    }

    //************************ VALIDATE ROOM UPDATE DATA ***********************//
    protected validateUpdateRoom(data: RoomUpdateData) {
        const schema = Joi.object().keys({
            name: Joi.string(),
            description: Joi.string(),
            image: Joi.string(),
            admins: Joi.object().keys({
                connect: Joi.object().keys({ id: Joi.array().items(Joi.string()) }),
                disconnect: Joi.object().keys({ id: Joi.array().items(Joi.string()) }),
            }),
            members: Joi.object().keys({
                connect: Joi.object().keys({ id: Joi.array().items(Joi.string()) }),
                disconnect: Joi.object().keys({ id: Joi.array().items(Joi.string()) }),
            })
        });
        return Joi.validate(data, schema);
    }
}

class ValidateRoom {
    private prisma;
    constructor() {
        this.prisma = new PrismaClient();
    }
    async validate(members: IUser['id'][], userId: IUser['id'], { error, next }) {
        await Promise.all(members.map(async friendId => {
            return new Promise(async (resolve, reject) => {
                let friendCheck = await this.alreadyFriends(friendId, userId, 0)
                if (!friendCheck) {
                    reject("Cannot connect non friend users to group")
                } else {
                    resolve(true);
                }
            })
        })).then(() => {
            next();
        }).catch(e => {
            error(e)
        })
    }

    private async alreadyFriends(friendId: IUser['id'], userId: IUser['id'], i: number): Promise<string | boolean> {
        return new Promise((resolve, reject) => {
            // This checks in both user->friend and friend->user entries
            // If friend is null; check again but reversed. Still null; return false, otherwise true
            // If friend is not null; send true
            this.prisma.friends.findFirst({ where: { friendId, userId } })
                .then(friend => resolve(friend == null ? (i == 0) ? this.alreadyFriends(userId, friendId, 1) : false : true))
                .catch(function (e) {
                    return reject(e.message);
                }).finally(() => {
                    this.prisma.$disconnect();
                })
        })
    }
}

export const RoomValidationMiddleware = new class ValidationMiddleware extends Validator {
    constructor() {
        super();
    }

    validateRoomCreate() {
        return (
            compose()
                .use((req: Request, res: Response, next) => {
                    super.validateCreateRoom(req.body)
                        .then(data => {
                            next();
                        }).catch(error => {
                            var errors = {
                                success: false,
                                msg: error.details[0].message,
                                data: error.name,
                                status: 400
                            };
                            Sender.errorSend(res, errors);
                            return;
                        })
                })
                .use((req: Request, res: Response, next) => {
                    if (req.body.admins.length > 0) {
                        req.body.admins = _.uniq(req.body.admins); // Only unique IDS 
                        req.body.admins = _.reject(req.body.admins, obj => obj == req['user'].id); // Remove user ID from admins
                        const validateRoom = new ValidateRoom();
                        validateRoom.validate(req.body.admins, req['user'].id, {
                            error: (msg) => Sender.errorSend(res, { success: false, status: 409, msg }),
                            next: () => next()
                        })
                    } else {
                        next()
                    }
                })
                .use((req: Request, res: Response, next) => {
                    if (req.body.members.length > 0) {
                        req.body.members = _.uniq(req.body.members); // Only unique IDS 
                        req.body.members = _.reject(req.body.members, obj => obj == req['user'].id); // Remove user ID from members
                        const validateRoom = new ValidateRoom();
                        validateRoom.validate(req.body.members, req['user'].id, {
                            error: (msg) => Sender.errorSend(res, { success: false, status: 409, msg }),
                            next: () => next()
                        })
                    } else {
                        next()
                    }
                })
        )
    }

    validateRoomUpdate() {
        return (
            compose()
                .use((req: Request, res: Response, next) => {
                    super.validateUpdateRoom(req.body)
                        .then(data => {
                            next();
                        }).catch(error => {
                            var errors = {
                                success: false,
                                msg: error.details[0].message,
                                data: error.name,
                                status: 400
                            };
                            Sender.errorSend(res, errors);
                            return;
                        })
                })
                .use(async (req: Request, res: Response, next) => {
                    const roomService = new ChatRoomService()
                    let room = await roomService.findOne({ id: req.params.id })
                    if (room == null) {
                        Sender.errorSend(res, { success: false, status: 400, msg: "Group not found" })
                    } else {
                        req['room'] = room
                        next();
                    }
                })
                .use((req: Request, res: Response, next) => {
                    if (req.body.admins != null && req.body.admins.connect != null && req.body.admins.connect.id.length > 0 && req['room'].owner.profile.userId == req['user'].id) {
                        req.body.admins.connect.id = _.uniq(req.body.admins.connect.id); // Only unique IDS 
                        req.body.admins.connect.id = _.reject(req.body.admins.connect.id, obj => obj == req['user'].id); // Remove user ID from members
                        console.log(req.body.admins.connect.id)
                        const validateRoom = new ValidateRoom();
                        validateRoom.validate(req.body.admins.connect.id, req['user'].id, {
                            error: (msg) => Sender.errorSend(res, { success: false, status: 409, msg }),
                            next: () => next()
                        })
                    } else if (req.body.admins != null && req.body.admins.disconnect != null && req.body.admins.disconnect.id.length > 0 && req['room'].owner.profile.userId == req['user'].id) {
                        req.body.admins.disconnect.id = _.uniq(req.body.admins.disconnect.id); // Only unique IDS 
                        req.body.admins.disconnect.id = _.reject(req.body.admins.disconnect.id, obj => obj == req['user'].id); // Remove user ID from members
                        let index = 0
                        for (; index < req.body.admins.disconnect.id.length; index++) {
                            const id = req.body.admins.disconnect.id[index]; 
                            if (_.some(req['room'].admins, { profile: { userId: id } }) == false) {
                                Sender.errorSend(res, { success: false, status: 400, msg: "There was an error removing a group member" })
                                break;
                            }
                        }
                        if (index == req.body.admins.disconnect.id.length) {
                            next();
                        }
                    } else {
                        next()
                    }
                })
                .use((req: Request, res: Response, next) => {
                    if (req.body.members != null && req.body.members.connect != null && req.body.members.connect.id.length > 0 && (_.includes(req['room'].admins, req['user'].id) || req['room'].owner.profile.userId == req['user'].id)) {
                        req.body.members.connect.id = _.uniq(req.body.members.connect.id); // Only unique IDS 
                        req.body.members.connect.id = _.reject(req.body.members.connect.id, obj => obj == req['user'].id); // Remove user ID from members
                        console.log(req.body.members.connect.id)
                        const validateRoom = new ValidateRoom();
                        validateRoom.validate(req.body.members.connect.id, req['user'].id, {
                            error: (msg) => Sender.errorSend(res, { success: false, status: 409, msg }),
                            next: () => next()
                        })
                    } else if (req.body.members != null && req.body.members.disconnect != null && req.body.members.disconnect.id.length > 0 && (_.includes(req['room'].admins, req['user'].id) || req['room'].owner.profile.userId == req['user'].id)) {
                        req.body.members.disconnect.id = _.uniq(req.body.members.disconnect.id); // Only unique IDS 
                        req.body.members.disconnect.id = _.reject(req.body.members.disconnect.id, obj => obj == req['user'].id); // Remove user ID from members
                        let index = 0
                        for (; index < req.body.members.disconnect.id.length; index++) {
                            const id = req.body.members.disconnect.id[index]; 
                            if (_.some(req['room'].members, { profile: { userId: id } }) == false) {
                                Sender.errorSend(res, { success: false, status: 400, msg: "There was an error removing a group member" })
                                break;
                            }
                        }
                        if (index == req.body.members.disconnect.id.length) {
                            next();
                        }
                    } else {
                        next()
                    }
                })
            // Need to check if the members connect and disconnect are already in the room or not
        )
    }

}
