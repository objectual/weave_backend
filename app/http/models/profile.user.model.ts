"use strict"; 
import { IUser } from './user.model';
export interface IProfile {
    phoneNo: string;
    firstName: string;
    lastName: string;
    birthday: Date;
    birthYearVisibility: Boolean;
    approved: Boolean;
    city?: string;
    country?: string;
    about?: string;
    profileImage?: string;
    userId?: IUser["id"];
    locationRange: Number;
    locationVisibility: Boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IProfileCreate {
    phoneNo: string;
}

export interface IProfileEdit {
    name?: string;
    about?: string;
    phoneNo?: string;
    birthday?: Date;
    birthYearVisibility?: Boolean;
    locationRange?: Number;
    locationVisibility?: Boolean;
    city?: string;
    country?: string;
} 