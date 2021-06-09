"use strict";
import { PrismaClient } from '@prisma/client'; 
import { IBlocked, IFriends } from '../models/connection.model'; 

export class FriendsService {
    private prisma;
    select = {
        id: true,
        user: true,
        friend: true,
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
                .findMany({ where, select:this.select })
                .then(friends => resolve(friends))
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        })
    }

    delete(where): Promise<any> {
        return new Promise((resolve, reject) => {
            this.prisma.friends
                .delete({ where })
                .then(data => resolve(data))
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        })
    }
    update(where): Promise<any> {
        return new Promise((resolve, reject) => {
            this.prisma.friends
                .deleteMany({ where })
                .then(data => resolve(data))
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        })
    }
}
export class BlockedService {
    private prisma;
    select = {
        id: true,
        user: true,
        friend: true, 
        createdAt: true,
        updatedAt: true,
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
                .findMany({ where, select:this.select })
                .then(blockedUsers => resolve(blockedUsers))
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        })
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
}