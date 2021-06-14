"use strict";
import { PrismaClient } from '@prisma/client'
import { IUser } from './user.model';
export interface IFriends {
    id?: string;
    approved: boolean;
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
            let friendCheck = await this.alreadyFriends(friendId, userId)
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

    private async alreadyFriends(friendId: IUser['id'], userId: IUser['id']): Promise<string | boolean> {
        return new Promise((resolve, reject) => {
            this.prisma.friends.findFirst({ where: { friendId, userId } })
                .then(friend => resolve(friend == null ? false : true))
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