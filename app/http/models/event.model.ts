"use strict";

import { ILocation } from "./location.model";
import { IUser } from "./user.model";

export interface IEvent {
    id?: string;
    title: string;
    description: string;
    from: Date;
    to: Date;
    location: ILocation;
    owner?: IUser;
    userId: IUser['id'];
    members: IUser['id'][];
    createdAt?: string;
    updatedAt?: string;
}

export interface IEventCreate {
    title: string;
    description: string;
    from: Date;
    to: Date;
    location: { connectOrCreate: { create: ILocation, where: { lat_long: { lat: number, long: number } } } };
    owner: { connect: { id: IUser['id'] } };
    members: { connect: { id: IUser['id'] }[] };
}

export interface IEventUpdate {
    title: string;
    description: string;
    from: Date;
    to: Date;
    location: { connectOrCreate: { create: ILocation, where: { lat_long: { lat: number, long: number } } } };
    members: { connect: { id: IUser['id'] }[], disconnect: { id: IUser['id'] }[] };
}