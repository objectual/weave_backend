"use strict";
import { PrismaClient } from '@prisma/client'
import { IUser } from './user.model';
export interface IImages {
    phoneNo: string;
    name: string;
    birthday: Date;
    birthYearVisibility: Boolean;
    approved: Boolean;
    city?: string;
    country?: string;
    about?: string;
    profileImage?: string;
    userId?: IUser["id"];
    createdAt?: Date;
    updatedAt?: Date;
}

export class ValidateImages {
    private prisma;
    constructor() {
        this.prisma = new PrismaClient();
    }
}