"use strict";
import { PrismaClient } from '@prisma/client'
import { IUser } from './user.model';
export interface IImages {
    id?: string;
    cloudinaryId: string;
    path: string;
    userId?: IUser["id"];
    createdAt?: Date;
    updatedAt?: Date;
}

export class ValidateImages {
    private prisma;
    constructor() {
        this.prisma = new PrismaClient();
    }
    public async validate(data: IUser['id'], { error, next }) {
        try {
            let userImagesCount = await this.countImages(data)
            console.log(userImagesCount)
            if (userImagesCount == 3) return error("Can't upload more than 3 images for your profile")
            else return next(userImagesCount);
        } catch (e) {
            console.log(e)
            return error(e);
        }
    }
    private async countImages(userId): Promise<string | number> {
        return new Promise((resolve, reject) => {
            this.prisma.images.count({ where: { userId, type: "USER" } })
                .then(count => resolve(count))
                .catch(function (e) {
                    return reject(e.message);
                }).finally(() => {
                    this.prisma.$disconnect();
                })
        })
    }
}