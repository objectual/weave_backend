"use strict";
import { PrismaClient } from '@prisma/client';
import { IEvent, IEventCreate, IEventUpdate } from '../models/event.model';
let select = {
    id: true,
    title: true,
    description: true,
    from: true,
    to: true,
    location: true,
    owner: { select: { profile: true } },
    members: { select: { profile: true } },
    createdAt: true,
    updatedAt: true,
}
interface IEventsResolver {
    events: IEvent[],
    count: number;
}
export class EventService {
    private prisma;
    constructor() {
        this.prisma = new PrismaClient();
    }
    create(event: IEventCreate): Promise<IEvent> {
        return new Promise((resolve, reject) => {
            this.prisma.event
                .create({ data: event, select })
                .then(event => resolve(event))
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        })
    }

    update(where, event: IEventUpdate): Promise<IEvent> {
        return new Promise((resolve, reject) => {
            this.prisma.event
                .update({ where, data: event, select })
                .then(event => resolve(event))
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        })
    }

    find(where): Promise<IEvent[]> {
        return new Promise((resolve, reject) => {
            this.prisma.event
                .findMany({ where, select })
                .then(event => resolve(event))
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        })
    }

    findOne(where): Promise<IEvent> {
        return new Promise((resolve, reject) => {
            this.prisma.event
                .findFirst({ where, select })
                .then(event => resolve(event))
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        })
    }

    findWithLimit(where, limit = null, page = null): Promise<IEventsResolver> {
        return new Promise((resolve, reject) => {
            this.prisma.event
                .findMany({ where, select, skip: limit * (page - 1) ? limit * (page - 1) : 0, take: limit ? limit : 50 })
                .then(async events => {
                    const eventsCount = await this.prisma.event.count({ where })
                    resolve({ events, count: eventsCount })
                })
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        });
    }

    delete(where): Promise<void | string> {
        return new Promise((resolve, reject) => {
            this.prisma.event
                .deleteMany({ where })
                .then(() => resolve())
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        })
    }
}