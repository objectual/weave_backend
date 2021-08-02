import jwt from "jsonwebtoken";
import compose from "composable-middleware"
import fs from "fs"
import { Request, Response } from "express"
import moment from "../../modules/moment"
import { UserService } from "../services/user.service";
import { Sender } from "../services/sender.service";

const publicKEY = fs.readFileSync("config/cert/accessToken.pub", "utf8");

export const AuthMiddleware = new class AuthenticationMiddleware {
    isAuthenticated() {
        return (
            compose()
                // Attach user to request
                .use((req: Request, res: Response, next) => {
                    // Remove Bearer from string
                    try {
                        let token = req['session'].auth;
                        if (!token)
                            return Sender.errorSend(res, {
                                success: false,
                                msg: "Access Denied.",
                                status: 401,
                            });
                        var i = process.env.ISSUER_NAME;
                        var s = process.env.SIGNED_BY_EMAIL;
                        var a = process.env.AUDIENCE_SITE;
                        var verifyOptions = {
                            issuer: i,
                            subject: s,
                            audience: a,
                            algorithm: ["RS256"],
                        };
                        let JWTSPLIT = token.split(".");
                        var decodedJWTHeader = JSON.parse(
                            Buffer.from(JWTSPLIT[0], "base64").toString()
                        );
                        if (decodedJWTHeader.alg != "RS256") {
                            Sender.errorSend(res, {
                                success: false,
                                msg: "Access Denied. Please login again.",
                                status: 401,
                            });
                            return;
                        }
                        var decoded = jwt.verify(token, publicKEY, verifyOptions);
                        req['user'] = decoded;
                        req['auth'] = token;
                        next();
                    } catch (ex) {
                        console.log("exception: " + ex);
                        Sender.errorSend(res, { success: false, msg: "Access Denied. Please login again", status: 400 });
                    }
                })
                .use(this.isValid())
                .use(this.refreshAuthToken())
        );
    }
    private refreshAuthToken() {
        return (
            compose()
                .use((req: Request, res: Response, next) => {
                    // This middleware will verify if the jwt is not compromised after user logged out
                    req['session'].cookie.expires = new Date(Date.now() + 48 * 60 * 60 * 1000)
                    req['session'].cookie.maxAge = 48 * 60 * 60 * 1000;
                    next();
                })
        )
    }
    private isValid() {
        return (
            compose()
                // Attach user to request
                .use((req: Request, res: Response, next) => {
                    let myUserService = new UserService();
                    myUserService.findOneAdmin({ id: req['user'].id, blocked: false })
                        .then(async user => {
                            if (user == null) {
                                await this.expireAuthToken(req, 10)
                                Sender.errorSend(res, {
                                    success: false,
                                    msg: "Your account access has been blocked.",
                                    status: 401,
                                });
                                throw true;
                            } else {
                                req['user'].data = user;
                                next();
                            }
                        });
                })
        );
    }

    isApproved() {
        return (
            compose()
                // Attach user to request
                .use((req: Request, res: Response, next) => {
                    if (req['user'].data.profile.approved == false) {
                        Sender.errorSend(res, {
                            success: false,
                            msg: "Your account details are incomplete. Please update your profile",
                            raw: { existing: true, approved: false },
                            status: 401,
                        });
                    }else{
                        next();
                    }
                })
        );
    }
    private expireAuthToken(req, exp) {
        return new Promise((resolve, reject) => {
            console.log(`Unauthorized access. Expiring session in ${exp}ms`)
            req.session.cookie.maxAge = exp;
            resolve(true);
        })
    }
}