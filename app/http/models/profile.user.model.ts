"use strict";
import { PrismaClient } from '@prisma/client'
import { IUser } from './user.model';
export interface IProfile {
    username: string;
    name: string;
    about?: string;
    phoneNo?: string;
    userId?: IUser["id"];
    profileImage?: string;
    followers?: number; 
    following?: number; 
    createdAt?: Date;
    updatedAt?: Date;
}

export class ValidateProfile {
    private prisma;
    constructor() {
        this.prisma = new PrismaClient();
    }
    public async validate(_profile: IProfile, { error, next }) {
        try {
            let validUsername = await this.username(_profile.username)
            if (validUsername != "") return error(validUsername)
            if (_profile.phoneNo != null) {
                let validPhone = await this.phoneNo(_profile.phoneNo)
                if (validPhone != "") return error(validPhone)
            }
            return next(_profile);
        } catch (e) {
            return error(e.message);
        }
    }
    private phoneNo(phoneNo: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this.prisma.profile.findUnique({ where: { phoneNo } })
                .then(profile => {
                    if (profile) {
                        return resolve("The specified phone number is already in use.");
                    }
                    return resolve("");
                }).catch(function (e) {
                    return reject(e.message);
                }).finally(() => {
                    this.prisma.$disconnect();
                })
        })
    }
    private username(username: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this.prisma.profile.findUnique({ where: { username } })
                .then(profile => {
                    if (profile) {
                        return resolve("The specified username is already in use.");
                    }
                    return resolve("");
                }).catch(function (e) {
                    return reject(e.message);
                }).finally(() => {
                    this.prisma.$disconnect();
                })
        })
    }
}