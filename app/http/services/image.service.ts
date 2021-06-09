"use strict";
import { PrismaClient } from '@prisma/client';
import { RedisService } from '../../cache/redis.service';
import { IImages } from '../models/images.user.model';
interface IImageCreate {
    cloudinaryId: string;
    path: string;
    userId: string;
}
const select = {
    id: true,
    cloudinaryId: true,
    path: true,
    type: true,
    createdAt: true,
    updatedAt: true,
}
export class ImageService extends RedisService {
    private prisma;
    constructor() {
        super()
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