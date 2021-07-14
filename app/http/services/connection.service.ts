"use strict";
import { PrismaClient } from '@prisma/client';
import { IBlocked, IFriends } from '../models/connection.model';
interface IFriendsResolver {
    friends: IFriends[],
    count: number;
}
interface IBlockedResolver {
    blocked: IBlocked[],
    count: number;
}
export class FriendsService {
    private prisma;
    select = {
        id: true,
        user: { select: { encryption: true, profile: true } },
        friend: { select: { encryption: true, profile: true } },
        approved: true,
        createdAt: true,
        updatedAt: true,
    }
    constructor() {
        this.prisma = new PrismaClient();
    }
    create(friend: IFriends): Promise<IFriends> {
        return new Promise((resolve, reject) => {
            this.prisma.friends
                .create({ data: friend })
                .then(friend => resolve(friend))
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        })
    }

    find(where): Promise<IFriends[]> {
        return new Promise((resolve, reject) => {
            this.prisma.friends
                .findMany({ where, select: this.select })
                .then(friend => resolve(friend))
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        });
    }

    findOne(where): Promise<IFriends> {
        return new Promise((resolve, reject) => {
            this.prisma.friends
                .findFirst({ where, select: this.select })
                .then(friend => resolve(friend))
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        });
    }

    findWithLimit(where, limit = null, page = null): Promise<IFriendsResolver> {
        return new Promise((resolve, reject) => {
            this.prisma.friends
                .findMany({ where, select: this.select, skip: limit * (page - 1) ? limit * (page - 1) : 0, take: limit ? limit : 50 })
                .then(async friends => {
                    const friendsCount = await this.prisma.friends.count({ where })
                    resolve({ friends, count: friendsCount })
                })
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        });
    }

    delete(where): Promise<any> {
        return new Promise((resolve, reject) => {
            this.prisma.friends
                .deleteMany({ where })
                .then(data => resolve(data))
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        })
    }

    findOneAndUpdate(where, data, options = null): Promise<any> {
        return new Promise((resolve, reject) => {
            this.prisma.friends
                .update({ where, data, select: this.select })
                .then(data => resolve(data))
                .catch(error => { reject(error) })
                .finally(() => this.prisma.$disconnect())
        });
    }
}
export class BlockedService {
    private prisma;
    select = {
        id: true,
        user: { select: { profile: true } },
        blocked: { select: { profile: true } },
        createdAt: true,
    }
    constructor() {
        this.prisma = new PrismaClient();
    }
    create(block: IBlocked): Promise<IBlocked> {
        return new Promise((resolve, reject) => {
            this.prisma.blockedList
                .create({ data: block })
                .then(block => resolve(block))
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        })
    }

    find(where): Promise<IBlocked[]> {
        return new Promise((resolve, reject) => {
            this.prisma.blockedList
                .findMany({ where, select: this.select })
                .then(block => resolve(block))
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        });
    }

    findOne(where): Promise<IBlocked> {
        return new Promise((resolve, reject) => {
            this.prisma.blockedList
                .findFirst({ where, select: this.select })
                .then(block => resolve(block))
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        });
    }

    findWithLimit(where, limit = null, page = null): Promise<IBlockedResolver> {
        return new Promise((resolve, reject) => {
            this.prisma.blockedList
                .findMany({ where, select: this.select, skip: limit * (page - 1) ? limit * (page - 1) : 0, take: limit ? limit : 50 })
                .then(async blocked => {
                    const blockedCount = await this.prisma.blockedList.count({ where })
                    resolve({ blocked, count: blockedCount })
                })
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        });
    }

    delete(where): Promise<any> {
        return new Promise((resolve, reject) => {
            this.prisma.blockedList
                .deleteMany({ where })
                .then(data => resolve(data))
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        })
    }
}