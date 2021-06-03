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
    // private prisma;
    constructor() {
        // this.prisma = new PrismaClient();
    }
}