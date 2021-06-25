"use strict";
import Joi from "joi";
import * as _ from "lodash";
import moment from 'moment';
import compose from "composable-middleware"
import { IEvent, IEventUpdate } from "../models/event.model";
import { Sender } from "../services/sender.service";
import { EventService } from "../services/event.service";
import { PrismaClient } from "@prisma/client";
import { IUser } from "../models/user.model";

interface EventCreateData extends IEvent {
    "address": string,
    "lat": number,
    "long": number
}

interface EventUpdateData extends IEventUpdate {
    "address": string,
    "lat": number,
    "long": number
}
class Validator {
    constructor() { }
    //************************ VALIDATE EVENT CREATE DATA ***********************//
    protected validateCreateEvent(data: EventCreateData) {
        const schema = Joi.object().keys({
            title: Joi.string().required(),
            description: Joi.string().required(),
            from: Joi.string().required(),
            to: Joi.string().required(),
            address: Joi.string().required(),
            lat: Joi.number().required(),
            long: Joi.number().required(),
            members: Joi.array().items(Joi.string())
        });
        return Joi.validate(data, schema);
    }

    //************************ VALIDATE EVENT UPDATE DATA ***********************//
    protected validateUpdateEvent(data: EventUpdateData) {
        const schema = Joi.object().keys({
            title: Joi.string(),
            description: Joi.string(),
            from: Joi.string(),
            to: Joi.string(),
            address: Joi.string(),
            lat: Joi.number(),
            long: Joi.number(),
            members: Joi.object().keys({
                connect: Joi.array().items({ id: Joi.string() }),
                disconnect: Joi.array().items({ id: Joi.string() }),
            })
        });
        return Joi.validate(data, schema);
    }
}

class ValidateEvent {
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

    async validateDate(to: string, from: string, { error, next }) { 
        if (!moment(from).isSameOrAfter(moment())) {
            return error("Event start date cannot be before today")
        } else if (!moment(to).isSameOrAfter(moment(from))) {
            return error("Event end date cannot be before start date")
        } else {
            next();
        }
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

export const EventValidationMiddleware = new class ValidationMiddleware extends Validator {
    constructor() {
        super();
    }

    validateEventCreate() {
        return (
            compose()
                .use((req, res, next) => {
                    super.validateCreateEvent(req.body)
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
                .use((req, res, next) => {
                    if (req.body.members.length > 0) {
                        req.body.members = _.uniq(req.body.members); // Only unique IDS 
                        req.body.members = _.reject(req.body.members, obj => obj == req.user.id); // Remove user ID from members
                        console.log(req.body.members)
                        const validateEvent = new ValidateEvent();
                        validateEvent.validate(req.body.members, req.user.id, {
                            error: (msg) => Sender.errorSend(res, { success: false, status: 409, msg }),
                            next: () => next()
                        })
                    } else {
                        next()
                    }
                }).use((req, res, next) => {
                    if (req.body.from != null && req.body.to != null) {
                        const validateEvent = new ValidateEvent();
                        validateEvent.validateDate(req.body.to, req.body.from, {
                            error: (msg) => Sender.errorSend(res, { success: false, status: 409, msg }),
                            next: () => next()
                        })
                    } else {
                        Sender.errorSend(res, { success: false, status: 400, msg: "Event dates required" });
                    }
                })
        )
    }

    validateEventUpdate() {
        return (
            compose()
                .use((req, res, next) => {
                    super.validateUpdateEvent(req.body)
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
                // Need to check if the members connect and disconnect are already in the event or not
                .use((req, res, next) => {
                    if (req.body.members.connect.id.length > 0) {
                        req.body.members.connect.id= _.uniq(req.body.members.connect.id); // Only unique IDS 
                        req.body.members.connect.id = _.reject(req.body.members.connect.id, obj => obj == req.user.id); // Remove user ID from members
                        console.log(req.body.members.connect.id)
                        const validateEvent = new ValidateEvent();
                        validateEvent.validate(req.body.members.connect.id, req.user.id, {
                            error: (msg) => Sender.errorSend(res, { success: false, status: 409, msg }),
                            next: () => next()
                        })
                    } else {
                        next()
                    }
                })
                .use(async (req, res, next) => {
                    const eventService = new EventService()
                    let event = await eventService.findOne({ id: req.params.id, userId: req.user.id })
                    if (event == null) {
                        Sender.errorSend(res, { success: false, status: 409, msg: "Only event owner can update event" })
                    }
                    next();
                }).use((req, res, next) => {
                    if (req.body.from != null && req.body.to != null) {
                        const validateEvent = new ValidateEvent();
                        validateEvent.validateDate(req.body.to, req.body.from, {
                            error: (msg) => Sender.errorSend(res, { success: false, status: 409, msg }),
                            next: () => next()
                        })
                    } else {
                        next()
                    }
                })
        )
    }

}
