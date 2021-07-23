"use strict";
import { PrismaClient } from '@prisma/client';
import { IRoom, IRoomCreate, IRoomUpdate } from '../models/room.model';
let select = {
    id: true,
    name: true,
    image: true,
    owner: { select: { profile: true } },
    members: { select: { profile: true } },
    createdAt: true,
    updatedAt: true,
}
interface IRoomsResolver {
    rooms: IRoom[],
    count: number;
}
export class ChatRoomService {
    private prisma;
    constructor() {
        this.prisma = new PrismaClient();
    }
    create(room: IRoomCreate): Promise<IRoom> {
        return new Promise((resolve, reject) => {
            this.prisma.room
                .create({ data: room, select })
                .then(room => resolve(room))
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        })
    }

    update(where, room: IRoomUpdate): Promise<IRoom> {
        return new Promise((resolve, reject) => {
            this.prisma.room
                .update({ where, data: room, select })
                .then(room => resolve(room))
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        })
    }

    find(where): Promise<IRoom[]> {
        return new Promise((resolve, reject) => {
            this.prisma.room
                .findMany({ where, select })
                .then(room => resolve(room))
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        })
    }

    findOne(where): Promise<IRoom> {
        return new Promise((resolve, reject) => {
            this.prisma.room
                .findFirst({ where, select })
                .then(room => resolve(room))
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        })
    }

    findWithLimit(where, limit = null, page = null): Promise<IRoomsResolver> {
        return new Promise((resolve, reject) => {
            this.prisma.room
                .findMany({ where, select, skip: limit * (page - 1) ? limit * (page - 1) : 0, take: limit ? limit : 50 })
                .then(async rooms => {
                    const roomsCount = await this.prisma.room.count({ where })
                    resolve({ rooms, count: roomsCount })
                })
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        });
    }

    delete(where): Promise<void | string> {
        return new Promise((resolve, reject) => {
            this.prisma.room
                .deleteMany({ where })
                .then(() => resolve())
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        })
    }
}