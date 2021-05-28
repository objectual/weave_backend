"use strict";
import { PrismaClient } from '@prisma/client';
import { IUser, IUserCreateProfile, IUserProfile } from "../models/user.model";
import { IProfile, IProfileCreate } from '../models/profile.user.model';
import { RedisService } from '../../cache/redis.service';

const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_ACCOUNT_TOKEN);

const select = {
    id: true,
    email: true,
    blocked: true,
    role: true,
    gcm: true,
    profile: true,
    images: true,
    createdAt: true,
    updatedAt: true,
};

const loginSelect = {
    id: true,
    email: true,
    role: true,
    gcm: true,
    createdAt: true,
    updatedAt: true,
    profile: true,
};
interface IFindResolver {
    users: IUserProfile[];
    count: number;
}
export class UserService extends RedisService {
    private prisma;
    constructor() {
        super()
        this.prisma = new PrismaClient();
    }
    parseUserBigIntJSON(_user): IUserProfile {
        return JSON.parse(JSON.stringify(_user, (_, v) => typeof v === 'bigint' ? `${v}n` : v)
            .replace(/"(-?\d+)n"/g, (_, a) => a))
    }
    create(_user: IUserCreateProfile, _profile: IProfileCreate): Promise<IUser> {
        return new Promise((resolve, reject) => {
            this.prisma.user
                .create({
                    data: _user, select
                })
                .then(_user => resolve(this.parseUserBigIntJSON(_user)))
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
                    where, select: select
                })
                .then(_user => resolve(this.parseUserBigIntJSON(_user)))
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        });
    }

    findOneAdmin(where): Promise<IUserProfile> {
        return new Promise((resolve, reject) => {
            this.prisma.user
                .findFirst({ where, select: loginSelect })
                .then(_user => resolve(this.parseUserBigIntJSON(_user)))
                .catch(error => reject(error))
                .finally(() => this.prisma.$disconnect())
        });
    }

    findOneAndUpdate(where, data, options = null): Promise<IUserProfile> {
        return new Promise((resolve, reject) => {
            this.prisma.user
                .update({ where, data, select })
                .then(_user => resolve(this.parseUserBigIntJSON(_user)))
                .catch(error => { reject(error) })
                .finally(() => this.prisma.$disconnect())
        });
    }

    findAndUpdateMany(where, data): Promise<IFindResolver> {
        return new Promise((resolve, reject) => {
            this.prisma.user
                .updateMany({ where, data, select })
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
                twilio.verify.services(process.env.TWILIO_SERVICE_SID)
                    .verificationChecks
                    .create({ to: `+${phoneNo}`, code })
                    .then(async message => {
                        if (message.valid == true) {
                            // SEND AUTH 
                            this.findOne({ profile: { phoneNo } })
                                .then(user => {
                                    if (user == null) resolve(null);
                                    resolve(user);
                                })
                                .catch(error => reject(error))
                        } else {
                            reject("Code does not match the code sent to your phone")
                        }
                    })
                    .catch(error => { reject(error) })
            } catch (e) {
                reject(e.message)
            }
        })
    }

    async redisSetUserData(auth: string, exp: number) {
        await super.setUserStateToken(auth, exp);
    }

    async redisUpdateUser(_user: IUserProfile) {
        await super.setData(_user.profile, `${_user.profile.phoneNo}|${_user.profile.userId}|user`, 0).catch((error) => { throw error })
    }
}
