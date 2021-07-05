"use strict";
import Joi from "joi";
import compose from "composable-middleware"
import { Request, Response } from "express"
import { GCM, IUser, Role } from "../models/user.model";
import { Sender } from "../services/sender.service";
import { PrismaClient } from "@prisma/client";
import { IProfileCreate } from "../models/profile.user.model";
interface UserRegister extends IUser {
    email: string;
    password: string;
    phoneNo: number;
    name: string
    gcm_id: string[],
    platform: string,
}
interface UserLogin extends IUser {
    email: string;
    password: string;
    role: Role;
    gcm_id: string[],
    platform: string,
}

interface UserUpdate extends IUser {
    username: string;
    name: string;
    about: string;
}

class Validator {
    constructor() { }
    //************************ VALIDATE USER REGISTER DATA ***********************//
    protected validateRegisterData(data: UserRegister) {
        const schema = Joi.object().keys({
            phoneNo: Joi.number().required(),
            username: Joi.string(),
            name: Joi.string(),
            profileImage: Joi.string(),
            email: Joi.string().email({ minDomainAtoms: 2 }),
        });
        return Joi.validate(data, schema);
    }

    //************************ VALIDATE USER VERIFY DATA ***********************//
    protected validateVerifyData(data: UserRegister) {
        const schema = Joi.object().keys({
            phoneNo: Joi.number().required(),
            code: Joi.number().required(),
            gcm_id: Joi.string(),
            platform: Joi.string(),
        });
        return Joi.validate(data, schema);
    }

    //************************ VALIDATE USER LOGIN DATA ***********************//
    protected validateLoginData(data: UserLogin) {
        const schema = Joi.object().keys({
            phoneNo: Joi.string().required(),
            // role: Joi.string().required(),
        });
        return Joi.validate(data, schema);
    }

    //************************ VALIDATE USER UPDATE DATA ***********************//
    protected validateUserUpdateData(data: UserUpdate) {
        const schema = Joi.object().keys({
            firstName: Joi.string(),
            lastName: Joi.string(),
            city: Joi.string(),
            country: Joi.string(),
            birthday: Joi.string(),
            profileImage: Joi.string(),
            birthYearVisibility: Joi.boolean(),
            locationRange: Joi.number(),
            locationVisibility: Joi.boolean(),
            about: Joi.string().min(4).max(60),
        });
        return Joi.validate(data, schema);
    }

    //************************ VALIDATE USER UPDATE REQUIRED DATA ***********************//
    protected validateUserUpdateDataRequired(data: UserUpdate) {
        const schema = Joi.object().keys({
            firstName: Joi.string().required(),
            lastName: Joi.string().required(),
            city: Joi.string().required(),
            country: Joi.string().required(),
            birthday: Joi.string().required(),
            profileImage: Joi.string().required(),
            birthYearVisibility: Joi.boolean(),
            locationRange: Joi.number(),
            locationVisibility: Joi.boolean(),
            about: Joi.string().min(4).max(60).required(),
        });
        return Joi.validate(data, schema);
    }

    //************************ VALIDATE ADMIN USER UPDATE DATA ***********************//
    protected validateAdminUserUpdateData(data: UserUpdate) {
        const schema = Joi.object().keys({
            email: Joi.string(),
            id: Joi.string().required(),
            blocked: Joi.boolean(),
            username: Joi.string(),
            name: Joi.string(),
            about: Joi.string(),
        });
        return Joi.validate(data, schema);
    }

}

export class ValidateUser {
    private prisma: PrismaClient;
    constructor() {
        this.prisma = new PrismaClient();
    }
    public async validate(data: IUser, { error, next }): Promise<string | IUser> {
        try {
            let user = data;
            let validEmail = await this.email(data.email)
            if (validEmail != "") return error(validEmail)
            return next(user);
        } catch (e) {
            return error(e);
        }
    }

    public async validateGCM(data: IUser, gcm_id: GCM['id'], { error, next }): Promise<string | boolean> {
        try {
            return next(await this.uniqueGCM(data.id, gcm_id))
        } catch (e) {
            return error(e)
        }
    }

    private uniqueGCM(user: IUser['id'], gcm: GCM['id']): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.prisma.gCM.findFirst({ where: { id: gcm } })
                .then(async gcmFound => {
                    if (gcmFound != null) {
                        if (gcmFound.userId == user) {
                            // already assigned to this user
                            return resolve(true)
                        } else if (gcmFound.userId != user || gcmFound.userId == null) {
                            // someone else has access to this token 
                            await this.updateGCM(gcmFound.id, user)
                            return resolve(true) // User owns this GCM now
                        }
                    } else if (gcmFound == null) {
                        return resolve(false);
                    }
                })
                .catch(function (e) {
                    return reject(e.message);
                }).finally(() => {
                    this.prisma.$disconnect();
                })
        })
    }

    private updateGCM(id: GCM['id'], user: IUser['id']): Promise<GCM> {
        console.log("Updating GCM", id, user)
        return new Promise((resolve, reject) => {
            this.prisma.gCM.update({ where: { id }, data: { userId: user } })
                .then(updatedGCM => resolve(updatedGCM))
                .catch(function (e) {
                    return reject(e.message);
                }).finally(() => {
                    this.prisma.$disconnect();
                })
        })
    }

    private email(email): Promise<string> {
        return new Promise((resolve, reject) => {
            this.prisma.user.findUnique({ where: { email } })
                .then(function (user) {
                    if (user) {
                        return resolve("The specified email address is already in use.");
                    }
                    let emailRegex = new RegExp(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
                    return resolve(!emailRegex.test(email) ? "Invalid email address" : "");
                })
                .catch(function (e) {
                    return reject(e.message);
                }).finally(() => {
                    this.prisma.$disconnect();
                })
        })
    }
}

class ValidateImages {
    private prisma;
    constructor() {
        this.prisma = new PrismaClient();
    }
    public async validate(data: IUser['id'], { error, next }) {
        try {
            let userImagesCount = await this.countImages(data)
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

export class ValidateProfile {
    private prisma;
    constructor() {
        this.prisma = new PrismaClient();
    }
    public async validate(_profile: IProfileCreate, { error, next }) {
        try {
            let validPhone = await this.phoneNo(_profile.phoneNo)
            if (validPhone != "") return error(validPhone)
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
}

export const UserValidationMiddleware = new class ValidationMiddleware extends Validator {
    constructor() {
        super();
    }
    validateUserRegistration() {
        return (
            compose()
                .use((req:Request, res:Response, next) => {
                    super.validateRegisterData(req.body)
                        .then(data => {
                            next();
                        }).catch(error => {
                            var errors = {
                                success: false,
                                msg: error.details[0].message,
                                data: error.name,
                                status: 400
                            };
                            Sender.errorSend(res, errors);
                            return;
                        });
                })
        )
    }
    validateUserVerify() {
        return (
            compose()
                .use((req:Request, res:Response, next) => {
                    super.validateVerifyData(req.body)
                        .then(data => {
                            next();
                        }).catch(error => {
                            var errors = {
                                success: false,
                                msg: error.details[0].message,
                                data: error.name,
                                status: 400
                            };
                            Sender.errorSend(res, errors);
                            return;
                        });
                })
        )
    }
    validateUserLogin() {
        return (
            compose()
                .use((req:Request, res:Response, next) => {
                    super.validateLoginData(req.body)
                        .then(data => {
                            next();
                        }).catch(error => {
                            var errors = {
                                success: false,
                                msg: error.details[0].message,
                                data: error.name,
                                status: 400
                            };
                            Sender.errorSend(res, errors);
                            return;
                        })
                })
        )
    }
    validateUserUpdate() {
        return (
            compose()
                .use((req:Request, res:Response, next) => {
                    if (req['user'].data.profile.approved == false) {
                        super.validateUserUpdateDataRequired(req.body)
                            .then(data => {
                                next();
                            }).catch(error => {
                                var errors = {
                                    success: false,
                                    msg: error.details[0].message,
                                    data: error.name,
                                    status: 400
                                };
                                Sender.errorSend(res, errors);
                                return;
                            })
                    } else {
                        super.validateUserUpdateData(req.body)
                            .then(data => {
                                next();
                            }).catch(error => {
                                var errors = {
                                    success: false,
                                    msg: error.details[0].message,
                                    data: error.name,
                                    status: 400
                                };
                                Sender.errorSend(res, errors);
                                return;
                            })
                    }
                })
        )
    }

    validateAdminUserUpdate() {
        return (
            compose()
                .use((req:Request, res:Response, next) => {
                    super.validateAdminUserUpdateData(req.body)
                        .then(data => {
                            next();
                        }).catch(error => {
                            var errors = {
                                success: false,
                                msg: error.details[0].message,
                                data: error.name,
                                status: 400
                            };
                            Sender.errorSend(res, errors);
                            return;
                        })
                })
        )
    }

    validateUserImageCount() {
        return (
            compose()
                .use((req:Request, res:Response, next) => {
                    const validateImages = new ValidateImages();
                    validateImages.validate(req['user'].id, {
                        error: (msg) => Sender.errorSend(res, { success: false, status: 409, msg }),
                        next: (count) => { req.body.alreadyUploaded = count; next() }
                    })
                })
        )
    }

}