"use strict";
import Joi from "joi";
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
        if (moment(from).diff(moment(), 'days') < 0) {
            return error("Event start date cannot be before today")
        } else if (moment(to).diff(moment(from), 'days') < 0) {
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
                        const validateEvent = new ValidateEvent();
                        validateEvent.validate(req.body.members, req.user.id, {
                            error: (msg) => Sender.errorSend(res, { success: false, status: 409, msg }),
                            next: () => next()
                        })
                    } else {
                        next()
                    }
                }).use((req, res, next) => {
                    if (req.body.start != null && req.body.end != null) {
                        const validateEvent = new ValidateEvent();
                        validateEvent.validateDate(req.body.to, req.user.from, {
                            error: (msg) => Sender.errorSend(res, { success: false, status: 409, msg }),
                            next: () => next()
                        })
                    } else {
                        next()
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
                .use(async (req, res, next) => {
                    const eventService = new EventService()
                    let event = await eventService.findOne({ id: req.params.id, userId: req.user.id })
                    if (event == null) {
                        Sender.errorSend(res, { success: false, status: 409, msg: "Only event owner can update event" })
                    }
                    next();
                }).use((req, res, next) => {
                    if (req.body.start != null && req.body.end != null) {
                        const validateEvent = new ValidateEvent();
                        validateEvent.validateDate(req.body.to, req.user.from, {
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
