"use strict";

import { IUser, } from "../models/user.model";
import * as Joi from "joi";

interface UserRegister extends IUser {
    firstName: string;
    lastName?: string,
    country: string,
    city: string,
    phoneNo: number;
    dob: Date;
    dobVisibility: boolean,
    locationRange: number,
    locationVisibility: boolean,
    aboutMe: string,
    gcm_id?: string[],
    platform: string,
}
interface UserLogin extends IUser {
    email: string;
    password: string;

}
interface UserSocialLogin extends IUser {
    token: string;
    gcm_id: string[];
    platform: string;
}

export class Validator {
    constructor() { }

    //************************ VALIDATE USER REGISTER DATA ***********************//
    validateRegisterData(data: UserRegister) {
        const schema = Joi.object().keys({
            // REQURIED 
            firstName: Joi.string().min(1).max(16).required(),
            lastName: Joi.string().min(1).max(16).required(),
            country: Joi.string().required(),
            city: Joi.string().required(),
            phoneNo: Joi.number().required(),
            dob: Joi.date().required(),
            dobVisibility: Joi.boolean().required(),
            locationRange: Joi.number().required(),
            locationVisibility: Joi.boolean().required(),
            aboutMe: Joi.string().min(12).max(60),
            gcm_id: Joi.string(),
            //Joi.array().items(Joi.string()),
            platform: Joi.string(),
        });
        return Joi.validate(data, schema);
    }

    //************************ VALIDATE USER LOGIN DATA ***********************//
    validateLoginData(data: UserLogin) {
        const schema = Joi.object().keys({
            email: Joi.string().email({ minDomainAtoms: 2 }).required(),
            password: Joi.string().min(5),
            type: Joi.string()
        });
        return Joi.validate(data, schema);
    }

    //************************ VALIDATE USER SOCIAL LOGIN DATA ***********************//
    socialLoginData(data: UserSocialLogin) {
        const schema = Joi.object().keys({
            token: Joi.string().required(),
            gcm_id: Joi.array().items(Joi.string()).required(),
            platform: Joi.string().required(),
        });
        return Joi.validate(data, schema);
    }


}
