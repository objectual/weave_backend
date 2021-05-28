"use strict";
import jwt from "jsonwebtoken";
import fs from "fs";
var privateKEY = fs.readFileSync('config/cert/accessToken.pem', 'utf8');
export class AuthService {
    public static generateAuthToken({ id, role }): Promise<string> {
        return new Promise((resolve, reject) => {
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
            try {
                resolve(jwt.sign(payload, privateKEY, signOptions));
            } catch (e) {
                reject(e.message)
            }
        })
    }
}