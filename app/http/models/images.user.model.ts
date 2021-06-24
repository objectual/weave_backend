"use strict"; 
import { IUser } from './user.model';
export interface IImages {
    id?: string;
    cloudinaryId: string;
    path: string;
    userId?: IUser["id"];
    createdAt?: Date;
    updatedAt?: Date;
}
