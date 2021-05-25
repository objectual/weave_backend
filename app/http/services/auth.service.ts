"use strict";
import moment, { unitOfTime } from "moment";
import * as defaults from "../../../config/default.json";

import jwt from "jsonwebtoken";
import fs from "fs";
var privateKEY = fs.readFileSync('config/cert/accessToken.pem', 'utf8');

import { UserService } from "./user.service";

export class AuthService {

    generateAuthToken({ id, role }, callback): String {
        var i = process.env.ISSUER_NAME;
        var s = process.env.SIGNED_BY_EMAIL;
        var a = process.env.AUDIENCE_SITE;
        var signOptions = {
            issuer: i,
            subject: s,
            audience: a,
            algorithm: "RS256",
        };
        var payload = {
            id,
            role
        };
        var token = jwt.sign(payload, privateKEY, signOptions);
        return callback(token);
    }
}  