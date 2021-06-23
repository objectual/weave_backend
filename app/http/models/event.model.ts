"use strict";

import { PrismaClient } from '@prisma/client'
import { ILocation } from "./location.model";
import { IUser } from "./user.model";
import moment from 'moment';
export interface IEvent {
    id?: string;
    title: string;
    description: string;
    from: Date;
    to: Date;
    location: ILocation;
    owner?: IUser;
    userId: IUser['id'];
    members: IUser['id'][];
    createdAt?: string;
    updatedAt?: string;
}

export interface IEventCreate {
    title: string;
    description: string;
    from: Date;
    to: Date;
    location: { connectOrCreate: { create: ILocation, where: { lat_long: { lat: number, long: number } } } };
    owner: { connect: { id: IUser['id'] } };
    members: { connect: { id: IUser['id'] }[] };
}

export interface IEventUpdate {
    title: string;
    description: string;
    from: Date;
    to: Date;
    location: { connectOrCreate: { create: ILocation, where: { lat_long: { lat: number, long: number } } } };
    members: { connect: { id: IUser['id'] }[], disconnect: { id: IUser['id'] }[] };
}

export class ValidateEvent {
    private prisma;
    constructor() {
        this.prisma = new PrismaClient();
    }
    async validate(data, { error, next }) {
        let { members, userId, to, from } = data;
        let index = 0;
        for (;index < members.length; index++) {
            const friendId = members[index];
            let friendCheck = await this.alreadyFriends(friendId, userId, 0)
            if (!friendCheck) {
                error("Cannot create event")
                break;
            }
        }
        console.log(moment(from).diff(moment(), 'days'), moment(to).diff(moment(from), 'days'))
        if (moment(from).diff(moment(), 'days') < 0) {
            return error("Event start date cannot be before today")
        }

        if (moment(to).diff(moment(from), 'days') < 0) {
            return error("Event end date cannot be before start date")
        }
        if(index == members.length){
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