"use strict";

import { IImages } from "./images.model";
import { IUser, IUserProfile } from "./user.model";
export interface IRoom {
    id?: string;
    name: string;
    description: string;
    owner?: IUserProfile;
    userId: IUser['id'];
    admins: IUserProfile[];
    members: IUserProfile[];
    createdAt?: string;
    updatedAt?: string;
}
export interface IRoomCreate {
    name: string;
    description: string;
    image: { create: { type: IImages['type'], cloudinaryId: IImages['cloudinaryId'], path: IImages['path'] } }
    owner: { connect: { id: IUser['id'] } };
    admins: { connect: { id: IUser['id'] }[] };
    members: { connect: { id: IUser['id'] }[] };
}

export interface IRoomUpdate {
    name?: string;
    description?: string;
    image?: { update: { cloudinaryId: IImages['cloudinaryId'], path: IImages['path'] } }
    owner?: { connect: { id: IUser['id'] }, disconnect?: { id: IUser['id'] } };
    admins?: { connect?: { id: IUser['id'] }[], disconnect?: { id: IUser['id'] }[] };
    members?: { connect?: { id: IUser['id'] }[], disconnect?: { id: IUser['id'] }[] };
}
