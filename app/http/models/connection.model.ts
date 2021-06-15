"use strict";
import { PrismaClient } from '@prisma/client'
import { BlockedService } from '../services/connection.service';
import { IUser, IUserProfile } from './user.model';
import * as _ from "lodash"
export interface IFriends {
    id?: string;
    approved: boolean;
    user?: IUserProfile;
    friend?: IUserProfile;
    friendId?: IUser["id"];
    userId?: IUser["id"];
    createdAt?: Date;
    updatedAt?: Date;
}

export class ValidateFriends {
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
export interface IBlocked {
    id?: string;
    user?: IUserProfile;
    blocked?: IUserProfile;
    blockedId?: IUser["id"];
    userId?: IUser["id"];
    createdAt?: Date;
    updatedAt?: Date;
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