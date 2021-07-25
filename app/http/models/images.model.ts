"use strict";
import { IRoom } from './room.model';
import { IUser } from './user.model';
export interface IImages {
    id?: string;
    cloudinaryId: string;
    path: string;
    type: string;
    roomId?: IRoom["id"];
    userId?: IUser["id"];
    createdAt?: Date;
    updatedAt?: Date;
}
