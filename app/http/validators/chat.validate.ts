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

interface RoomCreateData extends IRoomCreate {
    "name": string,
    "image": string,
}

interface RoomUpdateData extends IRoomUpdate {
    "name": string,
    "image": string,
}
class Validator {
    constructor() { }
    //************************ VALIDATE ROOM CREATE DATA ***********************//
    protected validateCreateRoom(data: RoomCreateData) {
        const schema = Joi.object().keys({
            name: Joi.string().required(),
            image: Joi.string().required(), 
            members: Joi.array().items(Joi.string())
        });
        return Joi.validate(data, schema);
    }

    //************************ VALIDATE ROOM UPDATE DATA ***********************//
    protected validateUpdateRoom(data: RoomUpdateData) {
        const schema = Joi.object().keys({
            name: Joi.string().required(),
            image: Joi.string().required(), 
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
        console.log(members)
        await Promise.all(members.map(async friendId => {
            return new Promise(async (resolve, reject) => {
                let friendCheck = await this.alreadyFriends(friendId, userId, 0)
                if (!friendCheck) {
                    reject("Cannot create event")
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
                    if (req.body.members.length > 0) {
                        req.body.members = _.uniq(req.body.members); // Only unique IDS 
                        req.body.members = _.reject(req.body.members, obj => obj == req['user'].id); // Remove user ID from members
                        console.log(req.body.members)
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
                    let event = await roomService.findOne({ id: req.params.id, userId: req['user'].id })
                    if (event == null) {
                        Sender.errorSend(res, { success: false, status: 409, msg: "Only chat room owner can update room" })
                    } else {
                        req['event'] = event
                        next();
                    }
                })
                .use((req: Request, res: Response, next) => {
                    if (req.body.members != null && req.body.members.connect != null && req.body.members.connect.id.length > 0) {
                        req.body.members.connect.id = _.uniq(req.body.members.connect.id); // Only unique IDS 
                        req.body.members.connect.id = _.reject(req.body.members.connect.id, obj => obj == req['user'].id); // Remove user ID from members
                        console.log(req.body.members.connect.id)
                        const validateRoom = new ValidateRoom();
                        validateRoom.validate(req.body.members.connect.id, req['user'].id, {
                            error: (msg) => Sender.errorSend(res, { success: false, status: 409, msg }),
                            next: () => next()
                        })
                    } else if (req.body.members != null && req.body.members.disconnect != null && req.body.members.disconnect.id.length > 0) {
                        req.body.members.disconnect.id = _.uniq(req.body.members.disconnect.id); // Only unique IDS 
                        req.body.members.disconnect.id = _.reject(req.body.members.disconnect.id, obj => obj == req['user'].id); // Remove user ID from members
                        let index = 0
                        for (; index < req.body.members.disconnect.id.length; index++) {
                            const id = req.body.members.disconnect.id[index];
                            console.log(_.some(req['event'].members, { profile: { userId: id } }), id)
                            if (_.some(req['event'].members, { profile: { userId: id } }) == false) {
                                Sender.errorSend(res, { success: false, status: 400, msg: "There was an error removing an event member" })
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
