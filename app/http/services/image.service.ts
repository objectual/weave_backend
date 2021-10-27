"use strict";
import { PrismaClient } from '@prisma/client'; 
import { IImages } from '../models/images.model';
interface IImageCreate {
    cloudinaryId: string;
    path: string;
    type?: string;
    position?: string;
    userId?: string;
    roomId?: string;
}
const select = {
    id: true,
    cloudinaryId: true,
    path: true,
    position: true,
    type: true,
    createdAt: true,
    updatedAt: true,
}
export class ImageService {
    private prisma;
    constructor() {
        this.prisma = new PrismaClient(); 
    }
    create(images: IImageCreate[]): Promise<IImages[]> {
        return new Promise((resolve, reject) => {
            this.prisma.images
                .createMany({ data: images })
                .then(images => resolve(images))
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        })
    }

    find(where): Promise<IImages[]> {
        return new Promise((resolve, reject) => {
            this.prisma.images
                .findMany({ where, select })
                .then(images => resolve(images))
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        })
    }

    findOne(where): Promise<IImages> {
        return new Promise((resolve, reject) => {
            this.prisma.images
                .findFirst({ where, select })
                .then(images => resolve(images))
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        })
    }

    delete(where): Promise<IImages> {
        return new Promise((resolve, reject) => {
            this.prisma.images
                .deleteMany({ where })
                .then(images => resolve(images))
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        })
    }
}