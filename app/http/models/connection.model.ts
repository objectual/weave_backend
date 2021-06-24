"use strict"; 
import { IUser, IUserProfile } from './user.model';
import * as _ from "lodash"
export interface IFriends {
    id?: string;
    approved: boolean;
    user?: IUserProfile;
    friend?: IUserProfile;
    friendId?: IUser["id"];
    userId?: IUser["id"];
    createdAt?: Date;
    updatedAt?: Date;
}
 
export interface IBlocked {
    id?: string;
    user?: IUserProfile;
    blocked?: IUserProfile;
    blockedId?: IUser["id"];
    userId?: IUser["id"];
    createdAt?: Date;
    updatedAt?: Date;
}

 