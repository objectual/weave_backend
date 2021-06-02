"use strict";
import { PrismaClient } from '@prisma/client';
import { RedisService } from '../../cache/redis.service';
import { IImages } from '../models/images.user.model';
interface IImageCreate{
    cloudinaryId:string;
    path:string;
    userId:string;
}
export class UserService extends RedisService {
    private prisma;
    constructor() {
        super()
        this.prisma = new PrismaClient();
    }
    create(images:IImageCreate[]):Promise<IImages[]>{
        return new Promise((resolve, reject)=>{
            this.prisma.images
            .createMany(images)
            .then(images=>resolve(images))
        })
    }
}