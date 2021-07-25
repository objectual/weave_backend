"use strict";
import Joi from "joi";
import * as _ from "lodash";
import compose from "composable-middleware"
import { IUser } from "../models/user.model";
import { IFriends } from "../models/connection.model";
import { Sender } from "../services/sender.service";
import { PrismaClient } from "@prisma/client";
import { BlockedService } from "../services/connection.service";
import { Request, Response } from "express"

interface FriendRequestData extends IUser {
    friend?: IUser['id'];
    id?: IFriends['id'];
    approved?: IFriends['approved'];
}

export class Validator {
    constructor() { }
    //************************ VALIDATE FRIEND REQUEST DATA ***********************//
    protected validateUserFriendRequest(data: FriendRequestData) {
        const schema = Joi.object().keys({
            friend: Joi.string().required(),
        });
        return Joi.validate(data, schema);
    }

    protected validateUserFriendRequestUpdate(data: FriendRequestData) {
        const schema = Joi.object().keys({
            id: Joi.string().required(),
            approved: Joi.string().required(),
        });
        return Joi.validate(data, schema);
    }

    //************************ VALIDATE FRIEND BLOCK REQUEST DATA ***********************//
    protected validateUserBlockRequest(data: FriendRequestData) {
        const schema = Joi.object().keys({
            user: Joi.string().required(),
        });
        return Joi.validate(data, schema);
    }

}


class ValidateFriends {
    private prisma;
    constructor() {
        this.prisma = new PrismaClient();
    }
    public async validate(friendId: IUser['id'], userId: IUser['id'], { error, next }) {
        try {
            let friendCheck = await this.alreadyFriends(friendId, userId, 0)
            if (friendCheck) {
                return error("Cannot send friend request")
            } else {
                return next()
            }
        } catch (e) {
            console.log(e)
            return error(e);
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

export class ValidateBlocked {
    private prisma;
    constructor() {
        this.prisma = new PrismaClient();
    }

    public async validate(blockedId: IUser['id'], userId: IUser['id'], { error, next }) {
        try {
            let blockedCheck = await this.alreadyBlocked(blockedId, userId)
            if (blockedCheck) {
                return error("Cannot block user")
            } else {
                return next()
            }
        } catch (e) {
            console.log(e)
            return error(e);
        }
    }

    public async userInBlockList(user: IUser['id'], { error, next }) {
        // This will create users list 
        const blockedService = new BlockedService();
        let orQuery = [
            { userId: user },
            { blockedId: user },
        ]
        let blockedUsersInBothLists = await blockedService.find({ OR: orQuery })
        if (blockedUsersInBothLists.length == 0) {
            next(null);
        } else {
            next({
                blockedByMe: _.map(_.filter(blockedUsersInBothLists, x => { if (x.user.profile.userId == user) { return x; } }), o => o.blocked.profile.userId),
                blockedByOthers: _.map(_.filter(blockedUsersInBothLists, x => { if (x.blocked.profile.userId == user) { return x; } }), o => o.user.profile.userId)
            })
        }
    }

    private async alreadyBlocked(blockedId: IUser['id'], userId: IUser['id']): Promise<string | boolean> {
        return new Promise((resolve, reject) => {
            this.prisma.blockedList.findFirst({ where: { blockedId, userId } })
                .then(blocked => resolve(blocked == null ? false : true))
                .catch(function (e) {
                    return reject(e.message);
                }).finally(() => {
                    this.prisma.$disconnect();
                })
        })
    }
}


export const ConnectionValidationMiddleware = new class ValidationMiddleware extends Validator {
    constructor() {
        super();
    }

    validateFriendRequest() {
        return (
            compose()
                .use((req:Request, res:Response, next) => {
                    super.validateUserFriendRequest(req.body)
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
                .use((req:Request, res:Response, next) => {
                    if (req.body.friend == req['user'].id) {
                        Sender.errorSend(res, { success: false, status: 400, msg: "Cannot send friend request" })
                    }
                    next();
                })
                .use((req:Request, res:Response, next) => {
                    const validateFriends = new ValidateFriends();
                    validateFriends.validate(req.body.friend, req['user'].id, {
                        error: (msg) => Sender.errorSend(res, { success: false, status: 409, msg }),
                        next: () => next()
                    })
                })
                .use((req:Request, res:Response, next) => {
                    let checkInMyList = _.indexOf(req['user'].data.blockedByMe, req.body.friend)
                    let checkInOthersList = _.indexOf(req['user'].data.blockedByOthers, req.body.friend)
                    if (checkInMyList == -1 && checkInOthersList == -1) {
                        next();
                    } else {
                        Sender.errorSend(res, { success: false, status: 409, msg: "Cannot send friend request" })
                    }
                })
        )
    }

    validateFriendRequestUpdate() {
        return (
            compose()
                .use((req:Request, res:Response, next) => {
                    super.validateUserFriendRequestUpdate({ id: req.params.id, approved: req.body.approved })
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
        )
    }

    blockedUsersList() {
        return (
            compose()
                .use((req:Request, res:Response, next) => { 
                    // Attaches blocked users in both list to the request
                    const validateBlocked = new ValidateBlocked();
                    validateBlocked.userInBlockList(req['user'].id, {
                        error: (msg) => Sender.errorSend(res, { success: false, status: 409, msg }),
                        next: (blockedObject) => {
                        console.log('blockedObject :', blockedObject);
                            if (blockedObject != null) {
                                req['user'].data.blockedByMe = blockedObject.blockedByMe // users I blocked
                                req['user'].data.blockedByOthers = blockedObject.blockedByOthers // users who blocked me 
                                next()
                            } else {
                                req['user'].data.blockedByMe = [] // users I blocked
                                req['user'].data.blockedByOthers = [] // users who blocked me  
                                next()
                            }
                        }
                    })
                })
        )
    }

    validateBlockedRequest() {
        return (
            compose()
                .use((req:Request, res:Response, next) => {
                    super.validateUserBlockRequest(req.body)
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
                .use((req:Request, res:Response, next) => {
                    if (req.body.user == req['user'].id) {
                        Sender.errorSend(res, { success: false, status: 400, msg: "Cannot block user" })
                    }
                    next();
                })
                .use((req:Request, res:Response, next) => {
                    const validateBlocked = new ValidateBlocked();
                    validateBlocked.validate(req.body.user, req['user'].id, {
                        error: (msg) => Sender.errorSend(res, { success: false, status: 409, msg }),
                        next: () => next()
                    })
                })
        )
    }

}
