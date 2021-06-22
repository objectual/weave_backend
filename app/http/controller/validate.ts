"use strict";
import Joi from "joi";
import { IUser, Role } from "../models/user.model";
import { IFriends } from "../models/connection.model";
import { IEvent, IEventUpdate } from "../models/event.model";
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
interface UserSocialLogin extends IUser {
    token: string;
    gcm_id: string[];
    platform: string;
}

interface UserUpdate extends IUser {
    username: string;
    name: string;
    about: string;
}

interface FriendRequestData extends IUser {
    friend?: IUser['id'];
    id?: IFriends['id'];
    approved?: IFriends['approved'];
}

interface EventCreateData extends IEvent {
    "address": string,
    "lat": number,
    "long": number
}

interface EventUpdateData extends IEventUpdate {
    "address": string,
    "lat": number,
    "long": number
}
export class Validator {
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

    //************************ VALIDATE FRIEND REQUEST DATA ***********************//
    protected validateUserFriendRequest(data: FriendRequestData) {
        const schema = Joi.object().keys({
            friend: Joi.string().required(),
        });
        return Joi.validate(data, schema);
    }

    protected validateUserFriendRequestUpdate(data: FriendRequestData) {
        const schema = Joi.object().keys({
            id: Joi.string().required(),
            approved: Joi.string().required(),
        });
        return Joi.validate(data, schema);
    }

    //************************ VALIDATE FRIEND BLOCK REQUEST DATA ***********************//
    protected validateUserBlockRequest(data: FriendRequestData) {
        const schema = Joi.object().keys({
            user: Joi.string().required(),
        });
        return Joi.validate(data, schema);
    }

    //************************ VALIDATE EVENT CREATE DATA ***********************//
    protected validateCreateEvent(data: EventCreateData) {
        const schema = Joi.object().keys({
            title: Joi.string().required(),
            description: Joi.string().required(),
            from: Joi.string().required(),
            to: Joi.string().required(),
            address: Joi.string().required(),
            lat: Joi.number().required(),
            long: Joi.number().required(),
            members: Joi.array().items(Joi.string())
        });
        return Joi.validate(data, schema);
    }

    //************************ VALIDATE EVENT UPDATE DATA ***********************//
    protected validateUpdateEvent(data: EventUpdateData) {
        const schema = Joi.object().keys({
            title: Joi.string(),
            description: Joi.string(),
            from: Joi.string(),
            to: Joi.string(),
            address: Joi.string(),
            lat: Joi.number(),
            long: Joi.number(),
            members: Joi.object().keys({
                connect: Joi.array().items({ id: Joi.string() }),
                disconnect: Joi.array().items({ id: Joi.string() }),
            })
        });
        return Joi.validate(data, schema);
    }
}
