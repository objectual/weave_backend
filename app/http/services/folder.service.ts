"use strict";
import { PrismaClient } from '@prisma/client';
import { IFolder, IFolderCreate,IFolderUpdate } from '../models/folder.model';
let select = {
    id: true,
    name: true,
    group: { select: { id: true ,name:true} },
    user:{select:{profile:true}},
    createdAt: true,
    updatedAt: true,
}
interface IEventsResolver {
    events: IFolder[],
    count: number;
}
export class FolderService {
    private prisma;
    constructor() {
        this.prisma = new PrismaClient();
        // this.prisma.event.update({where: {id: "6ffcbdce-d4cc-4371-95ac-543efbccd090"}, data: {members: {disconnect: [{id: ""}]}}})
    }
    create(folder: IFolderCreate): Promise<IFolder> {
        return new Promise((resolve, reject) => {
            this.prisma.folder
                .create({ data: folder })
                .then(folder => resolve(folder))
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        })
    }

    update(where, event: IFolderUpdate): Promise<IFolder> {
        return new Promise((resolve, reject) => {
            this.prisma.folder
                .update({ where, data: event, select })
                .then(event => resolve(event))
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        })
    }

    find(where): Promise<IFolder[]> {  
        return new Promise((resolve, reject) => {
            this.prisma.folder
                .findMany({ where,select})
                .then(event => resolve(event))
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        })
    }

    findOne(where): Promise<IFolder> {
        return new Promise((resolve, reject) => {
            this.prisma.folder
                .findFirst({ where })
                .then(event => resolve(event))
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        })
    }

    // findWithLimit(where, limit = null, page = null): Promise<IEventsResolver> {
    //     return new Promise((resolve, reject) => {
    //         this.prisma.event
    //             .findMany({ where, select, skip: limit * (page - 1) ? limit * (page - 1) : 0, take: limit ? limit : 50 })
    //             .then(async events => {
    //                 const eventsCount = await this.prisma.event.count({ where })
    //                 resolve({ events, count: eventsCount })
    //             })
    //             .catch(error => reject(error))
    //             .finally(() => this.prisma.$disconnect())
    //     });
    // }

    delete(where): Promise<void | string> {
        return new Promise((resolve, reject) => {
            this.prisma.folder
                .deleteMany({ where })
                .then(() => resolve())
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        })
    }
}