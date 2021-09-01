"use strict";
 
import { IRoom } from "./room.model";
import { IUser,IUserProfile } from "./user.model";
 
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
    group?: { connect?: { id: IRoom['id'] }[] };    
    user?: { connect?: { id: IUser['id'] }[] };
    owner: { connect: { id: IUser['id'] } };
}
export interface IFolderUpdate {
    group?: { connect?: { id: IRoom['id'] }[], disconnect?: { id: IRoom['id'] }[] };    
    user?: { connect?: { id: IUser['id'] }[], disconnect?: { id: IUser['id'] }[] };    
}