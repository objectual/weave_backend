"use strict";

import { IUser } from "./user.model";
export interface IRoom {
    id?: string;
    name: string;
    image: string;
    owner?: IUser;
    userId: IUser['id'];
    members: IUser['id'][];
    createdAt?: string;
    updatedAt?: string;
}
export interface IRoomCreate {
    name: string;
    image: string;
    owner: { connect: { id: IUser['id'] } };
    members: { connect: { id: IUser['id'] }[] };
}

export interface IRoomUpdate {
    name: string;
    image: string;
    members?: { connect?: { id: IUser['id'] }[], disconnect?: { id: IUser['id'] }[] };
}
