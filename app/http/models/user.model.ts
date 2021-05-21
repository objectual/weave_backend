"use strict";
import mongoose, { Schema, Document } from 'mongoose';
// const mongoose = require("mongoose");
var mongooseTypes = require("mongoose-types"); //for valid email and url
mongooseTypes.loadTypes(mongoose, "email");
var crypto = require('crypto');

export interface IUser extends Document {
    profile_img: string[],
    firstName?: string;
    lastName?: string;
    country: string,
    city: string,
    phoneNo: number;
    dob: Date;
    dobVisibility: boolean,
    locationRange: number,
    locationVisibility: boolean,
    aboutMe: string,
    gcm_id?: string[],
    platform: string,
    isActive: boolean,
    isDeleted: boolean,
    createdDate: Date,
    updatedDate: Date,
}



const UserSchema = new Schema<IUser>({
    firstName: { type: String },

    lastName: { type: String },

    profile_img: {
        type: [String],
        default: "https://easy-1-jq7udywfca-uc.a.run.app/public/images/user.png",
    },

    phoneNo: {
        type: Number,
        required: true,
    },

    isPhoneVerified: {
        type: Boolean,
        default: false
    },

    isActive: {
        type: Boolean,
        default: true,
    },

    isDeleted: {
        type: Boolean,
        default: false,
    },

    dob: {
        type: Date,
        required: true
    },

    gcm_id: {
        type: [String]
    },

    platform: { type: String },

    createdDate: {
        type: Date,
        default: Date.now,
    },

    updatedDate: {
        type: Date,
        default: null,
    }
});


// Export the model and return your IUser interface
export default mongoose.model<IUser>('users', UserSchema);