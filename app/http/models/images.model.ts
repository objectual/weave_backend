"use strict";
import { IRoom } from './room.model';
import { IUser } from './user.model';
export interface IImages {
    id?: string;
    cloudinaryId: string;
    path: string;
    type: string;
    position?: string;
    roomId?: IRoom["id"];
    userId?: IUser["id"];
    createdAt?: Date;
    updatedAt?: Date;
}

enum Position {
    left = "LEFT",
    right = "RIGHT",
    middle = "MIDDLE"
}