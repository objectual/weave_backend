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
            let friendCheck = await this.alreadyFriends(friendId,userId)
            if(friendCheck){
                return error("Cannot send friend request")
            }else{
                return next()
            }
        } catch (e) {
            console.log(e)
            return error(e);
        }
    }

    private async alreadyFriends(friendId: IUser['id'], userId: IUser['id']): Promise<string | boolean> {
        return new Promise((resolve, reject) => {
            this.prisma.friends.findFirst({ where: { friendId, userId, approved: true } })
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
    public async validate(data: IUser['id'], { error, next }) {
        try {

        } catch (e) {
            console.log(e)
            return error(e);
        }
    }
}