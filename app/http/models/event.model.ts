"use strict";

import { ILocation } from "./location.model";
import { IUser } from "./user.model";

export interface IEvent {
    id?: string;
    title: string;
    description: string;
    from: string;
    to: string;
    location: ILocation;
    owner?: IUser;
    userId: IUser['id'];
    members: IUser[];
    createdAt?: string;
    updatedAt?: string;
}

export interface IEventCreate {
    title: string;
    description: string;
    from: string;
    to: string;
    location: { connectOrCreate: { create: ILocation, where: ILocation } };
    owner: { connect: { id: IUser['id'] } };
    members: { connect: { id: IUser['id'] }[] };
}

export interface IEventUpdate {
    title: string;
    description: string;
    from: string;
    to: string;
    location: { connectOrCreate: { create: ILocation, where: ILocation } };
    members: { connect: { id: IUser['id'] }[], disconnect: { id: IUser['id'] }[] };
}