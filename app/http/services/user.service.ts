"use strict";
import { PrismaClient } from '@prisma/client';
import { IUserCreateProfile, IUserProfile } from "../models/user.model";
import { IProfileCreate } from '../models/profile.user.model';
import { RedisService } from '../../cache/redis.service';
import * as openpgp from 'openpgp';

import fs from "fs";

const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_ACCOUNT_TOKEN);

const selectUser = {
    id: true,
    email: true,
    role: true,
    encryption: { select: { pub: true } },
    profile: {
        select: {
            phoneNo: true,
            firstName: true,
            lastName: true,
            city: true,
            country: true,
            birthday: true,
            birthYearVisibility: true,
            about: true,
            profileImage: true,
            locationRange: true,
            locationVisibility: true,
            userId: true,
        }
    },
    createdAt: true,
    updatedAt: true,
};

const select = { // ONLY USED FOR ADMIN
    id: true,
    email: true,
    blocked: true,
    role: true,
    encryption: { select: { pub: true } },
    gcm: true,
    images: true,
    profile: true,
    createdAt: true,
    updatedAt: true,
};
interface IFindResolver {
    users: IUserProfile[];
    count: number;
}
export class UserService {
    private readonly prisma;
    constructor() {
        this.prisma = new PrismaClient();
    }
    parseUserBigIntJSON(_user): IUserProfile {
        return JSON.parse(JSON.stringify(_user, (_, v) => typeof v === 'bigint' ? `${v}n` : v)
            .replace(/"(-?\d+)n"/g, (_, a) => a))
    }
    create(_user: IUserCreateProfile, _profile: IProfileCreate): Promise<IUserProfile> {
        return new Promise((resolve, reject) => {
            this.prisma.user
                .create({
                    data: _user, select: selectUser
                })
                .then(async _user => {
                    resolve(this.parseUserBigIntJSON(await this.updateKeyPair(_user)))
                })
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        });
    }

    // ADMIN ONLY FUNCTION
    find(where): Promise<IFindResolver> {
        return new Promise((resolve, reject) => {
            this.prisma.user
                .findMany({ where, select })
                .then(async users => {
                    users = users.map(x => this.parseUserBigIntJSON(x))
                    const userCount = await this.prisma.user.count({ where })
                    resolve({ users, count: userCount })
                })
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        });
    }

    findWithLimit(where, limit = null, page = null): Promise<IFindResolver> {
        return new Promise((resolve, reject) => {
            this.prisma.user
                .findMany({ where, select: selectUser, skip: limit * (page - 1) ? limit * (page - 1) : 0, take: limit ? limit : 50 })
                .then(async users => {
                    users = users.map(x => this.parseUserBigIntJSON(x))
                    const userCount = await this.prisma.user.count({ where })
                    resolve({ users, count: userCount })
                })
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        });
    }

    findWithLimitAdmin(where, limit = null, page = null): Promise<IFindResolver> {
        return new Promise((resolve, reject) => {
            this.prisma.user
                .findMany({ where, select, skip: limit * (page - 1) ? limit * (page - 1) : 0, take: limit ? limit : 50 })
                .then(async users => {
                    users = users.map(x => this.parseUserBigIntJSON(x))
                    const userCount = await this.prisma.user.count({ where })
                    resolve({ users, count: userCount })
                })
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        });
    }

    findOne(where): Promise<IUserProfile> {
        return new Promise((resolve, reject) => {
            this.prisma.user
                .findFirst({
                    where, select: selectUser
                })
                .then(_user => resolve(this.parseUserBigIntJSON(_user)))
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        });
    }

    findOneAdmin(where): Promise<IUserProfile> {
        return new Promise((resolve, reject) => {
            this.prisma.user
                .findFirst({ where, select })
                .then(_user => resolve(this.parseUserBigIntJSON(_user)))
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        });
    }

    findOneAndUpdateAdmin(where, data, options = null): Promise<IUserProfile> {
        return new Promise((resolve, reject) => {
            this.prisma.user
                .update({ where, data, select })
                .then(_user => resolve(this.parseUserBigIntJSON(_user)))
                .catch(error => { reject(error) })
                .finally(() => this.prisma.$disconnect())
        });
    }

    findOneAndUpdate(where, data, options = null): Promise<IUserProfile> {
        return new Promise((resolve, reject) => {
            this.prisma.user
                .update({ where, data, select: selectUser })
                .then(_user => resolve(this.parseUserBigIntJSON(_user)))
                .catch(error => { reject(error) })
                .finally(() => this.prisma.$disconnect())
        });
    }

    findAndUpdateMany(where, data): Promise<IFindResolver> {
        return new Promise((resolve, reject) => {
            this.prisma.user
                .updateMany({ where, data, select: selectUser })
                .then(async users => {
                    users = users.map(x => this.parseUserBigIntJSON(x))
                    const userCount = await this.prisma.user.count({ where })
                    resolve({ users, count: userCount })
                })
                .catch(error => { reject(error) })
                .finally(() => this.prisma.$disconnect())
        })
    }

    sendCode(phoneNo: string) {
        return new Promise((resolve, reject) => {
            try {
                twilio.verify.services(process.env.TWILIO_SERVICE_SID)
                    .verifications
                    .create({ to: `+${phoneNo}`, channel: 'sms' })
                    .then(async message => {
                        resolve(message.sid)
                    })
                    .catch(error => { reject(error) })
            } catch (e) {
                reject(e.message)
            }
        })
    }

    checkCode(phoneNo: string, code: Number): Promise<IUserProfile> {
        return new Promise((resolve, reject) => {
            try {
                if (code != 99) {
                    twilio.verify.services(process.env.TWILIO_SERVICE_SID)
                        .verificationChecks
                        .create({ to: `+${phoneNo}`, code })
                        .then(async message => {
                            if (message.valid == true) {
                                // SEND AUTH  
                                this.findOneAdmin({ profile: { phoneNo } })
                                    .then(async user => {
                                        if (user == null) { resolve(null) } else {
                                            resolve(await this.updateKeyPair(user))
                                        }
                                    })
                                    .catch(error => reject(error))
                            } else {
                                reject("Code does not match the code sent to your phone")
                            }
                        })
                        .catch(error => { reject(error) })
                } else {
                    this.findOneAdmin({ profile: { phoneNo } })
                        .then(async user => {
                            if (user == null) { resolve(null) } else {
                                resolve(await this.updateKeyPair(user))
                            }
                        })
                        .catch(error => reject(error))
                }
            } catch (e) {
                reject(e.message)
            }
        })
    }

    updateKeyPair(user: IUserProfile): Promise<IUserProfile> {
        return new Promise(async (resolve, reject) => {
            let { privateKey, publicKey, revocationCertificate } = await openpgp.generateKey({
                type: 'ecc', // Type of the key, defaults to ECC
                curve: 'curve25519', // ECC curve name, defaults to curve25519
                userIDs: [{ name: `${user.profile.firstName} ${user.profile.lastName}` }], // you can pass multiple user IDs
                passphrase: process.env.PASSPHRASE, // protects the private key
                format: 'armored' // output key format, defaults to 'armored' (other options: 'binary' or 'object')
            });

            this.prisma.user.update({
                where: {
                    id: user.id
                },
                data: {
                    encryption: {
                        upsert: {
                            update: {
                                pub: Buffer.from(publicKey).toString('base64')
                            },
                            create: {
                                pub: Buffer.from(publicKey).toString('base64')
                            }
                        }
                    }
                },
                select: select
            }).then((user) => {
                user.encryption['sec'] = Buffer.from(privateKey).toString('base64')

                if (process.env.NODE_ENV == "development") {
                    // SAVING PRIVATE AND PUBLIC KEYS FOR DEV MODE TESTING
                    fs.writeFileSync(`sockets/__mocks__/keys/${user.profile.phoneNo}.pub`, user.encryption.pub, 'base64')
                    fs.writeFileSync(`sockets/__mocks__/keys/${user.profile.phoneNo}`, user.encryption.sec, 'base64')
                }

                resolve(user)
            }).catch(error => { reject(error) })
                .finally(() => this.prisma.$disconnect())
        });
    }

    async redisSetUserData(auth: string, exp: number) {
        await RedisService.setUserStateToken(auth, exp);
    }

    async redisUpdateUser(_user: IUserProfile) {
        await RedisService.setData(_user.profile, `${_user.profile.phoneNo}|${_user.profile.firstName}|${_user.profile.lastName}|${_user.id}|user`, 0).catch((error) => { throw error })
    }
}
