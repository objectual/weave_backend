"use strict"; 
import { IImages } from './images.user.model';
import { IProfile, IProfileCreate, IProfileEdit } from './profile.user.model';
export interface IUser {
    id?: string;
    email?: string;
    role?: Role;
    blocked?: boolean;
    gcm?:GCM[];
    images?: IImages[];
    createdAt?: Date;
    updatedAt?: Date;
}

export enum Role {
    USER = 'USER',
    ADMIN = 'ADMIN',
}

export interface GCM {
    id: string;
    platform: string;
    userId: IUser['id'];
}

export interface IUserEdit {
    email?: string;
    blocked?: boolean;
    profile?: { update: IProfileEdit };
}

export interface IUserProfile extends IUser {
    profile: IProfile;
}

export interface IUserCreateProfile extends IUser {
    profile: { create: IProfileCreate }
} 