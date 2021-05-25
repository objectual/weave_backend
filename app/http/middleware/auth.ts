import jwt from "jsonwebtoken";
import compose from "composable-middleware"
import fs from "fs"
import moment from "../../modules/moment"
import { UserService } from "../services/user.service";
import { RedisService } from "../../cache/redis.service";

var publicKEY = fs.readFileSync("config/cert/accessToken.pub", "utf8");

export class AuthenticationMiddleware extends RedisService {
    constructor() {
        super();
    }
    isAuthenticated() {
        return (
            compose()
                // Attach user to request
                .use((req, res, next) => {
                    let token = req.headers['x-access-token'] || req.headers['authorization'];
                    if (!token)
                        return res.status(401).send({
                            success: false,
                            msg: "Access Denied. No token provided.",
                            code: 401,
                        });
                    // Remove Bearer from string
                    token = token.replace(/^Bearer\s+/, "");
                    try {
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
                            res.send({
                                success: false,
                                msg: "Access Denied. Compromised Authorized Token.",
                                status: 401,
                            });
                            return;
                        }
                        var decoded = jwt.verify(token, publicKEY, verifyOptions);
                        req.user = decoded;
                        req.auth = token;
                        next();
                    } catch (ex) {
                        console.log("exception: " + ex);
                        res
                            .status(400)
                            .send({ success: false, msg: "Invalid token.", status: 400 });
                    }
                })
                .use(this.isValid())
                .use(this.refreshAuthToken())
        );
    }
    private refreshAuthToken() {
        return (
            compose()
                .use((req, res, next) => {
                    // This middleware will verify if the jwt is not compromised after user logged out
                    super.getUserStateToken(req.auth).then(data => {
                        if (data == null) {
                            console.log("Compromised Token!")
                            res.status(401).send({
                                success: false,
                                msg: "Access Denied. Compromised Authorized Token.",
                                status: 401,
                            });
                            return;
                        } else {
                            super.setUserStateToken(req.auth, moment(moment().add(48, 'hours')).fromNow_seconds())
                                .then((success) => {
                                    if (success) {
                                        console.log("Refresh Token Record Updated")
                                        next();
                                    }
                                })
                                .catch((error) => res.json(error));
                        }
                    })
                })
        )
    }
    private isValid() {
        return (
            compose()
                // Attach user to request
                .use((req, res, next) => {
                    let myUserService = new UserService();
                    myUserService.findOne({ id: req.user.id, blocked: false })
                        .then(user => {
                            try {
                                if (user == null) {
                                    res.status(401).send({
                                        success: false,
                                        msg: "Your account access has been blocked.",
                                        status: 401,
                                    });
                                    throw true;
                                } else {
                                    next();
                                }
                            } catch (ex) {
                                this.expireAuthToken(req.auth, 10)
                                    .then(raw => { })
                            }
                        });
                })
        );
    }
    private expireAuthToken(auth, exp) {
        return new Promise((resolve, reject) => {
            super.setUserStateToken(auth, moment(moment().add(exp, 'seconds')).fromNow_seconds())
                .then((success) => {
                    if (success) {
                        console.log(`Refresh Token record updated and expiring in ${exp} seconds`)
                        resolve(true)
                    }
                })
                .catch((error) => reject(error));
        })
    }
}