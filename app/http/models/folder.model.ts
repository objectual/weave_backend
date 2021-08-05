"use strict";
 
import { IRoom } from "./room.model";
import { IUser,IUserProfile } from "./user.model";
// import moment from 'moment';
// export interface IEvent {
//     id?: string;
//     title: string;
//     description: string;
//     from: Date;
//     to: Date;
//     location: ILocation;
//     owner?: IUser;
//     userId: IUser['id'];
//     members: IUser['id'][];
//     createdAt?: string;
//     updatedAt?: string;
// }

// export interface IEventCreate {
//     title: string;
//     description: string;
//     from: Date;
//     to: Date;
//     location: { connectOrCreate: { create: ILocation, where: { lat_long: { lat: number, long: number } } } };
//     owner: { connect: { id: IUser['id'] } };
//     members: { connect: { id: IUser['id'] }[] };
// }

// export interface IEventUpdate {
//     title: string;
//     description: string;
//     from: Date;
//     to: Date;
//     location?: { connectOrCreate: { create: ILocation, where: { lat_long: { lat: number, long: number } } } };
//     members?: { connect?: { id: IUser['id'] }[], disconnect?: { id: IUser['id'] }[] };
// }
 
export interface IFolder{
    id?: string;
    name: string;
    owner?: IUser;
    userId: IUser['id'];
    group: IUserProfile[];
    user: IUserProfile[];
    createdAt?: string;
    updatedAt?: string;
}

export interface IFolderCreate {
    name: string;
    owner: { connect: { id: IUser['id'] } };
}
export interface IFolderUpdate {
    group?: { connect?: { id: IRoom['id'] }[], disconnect?: { id: IRoom['id'] }[] };    
    user?: { connect?: { id: IUser['id'] }[], disconnect?: { id: IUser['id'] }[] };    
}