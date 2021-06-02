import * as _ from "lodash";
import { UserService } from "../../../services/user.service";
import { RedisService } from "../../../../cache/redis.service";
import { AuthService } from "../../../services/auth.service";
import { IProfileCreate, ValidateProfile } from "../../../models/profile.user.model";
import { SenderService } from "../../../services/sender.service";
import { ValidateUser } from "../../../models/user.model";

export class Authentication extends RedisService {
    constructor() {
        super();
    }

    login(req, res) {
        try {
            let { phoneNo } = req.body;
            const myUserService = new UserService();
            myUserService.sendCode(phoneNo)
                .then(message => {
                    SenderService.send(res, { success: true, msg: "Verification code sent to your phone number", status: 200 });
                }).catch((error) => {
                    SenderService.errorSend(res, { success: false, msg: "There was an error in verifying SMS code", raw: error.message, status: 500 });
                })
        } catch (error) {
            SenderService.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }

    async verify(req, res) {
        try {
            let { phoneNo, code, gcm_id, platform } = req.body
            const myUserService = new UserService();
            const userValidationService = new ValidateUser();
            const myValidateProfile = new ValidateProfile();
            await myUserService.checkCode(phoneNo, code)
                .then(async user => {
                    console.log(user)
                    let existing = false;
                    let approved = false;
                    if (user == null) {
                        await myValidateProfile.validate({ phoneNo }, {
                            error: message => SenderService.errorSend(res, { success: false, msg: message, status: 400 }),
                            next: async (profile: IProfileCreate) => {
                                let _newUser = { profile: { create: profile } }
                                const myUserService = new UserService();
                                user = await myUserService.create(_newUser, profile);
                                existing = false;
                                approved = false;
                            }
                        })
                    } else if (user != null) {
                        if (user.blocked) {
                            SenderService.errorSend(res, { success: false, msg: "There was an error logging in. Your account has been suspended", status: 409 });
                            return;
                        } else if (!user.blocked && !user.profile.approved) {
                            existing = true; approved = false
                        } else if (!user.blocked && user.profile.approved) {
                            existing = true; approved = true
                        }
                    } 
                    await userValidationService.validateGCM(user, gcm_id, {
                        error: message => SenderService.errorSend(res, { success: false, msg: message, status: 400 }),
                        next: async uniqueGCM => {
                            let token = await AuthService.generateAuthToken({ id: user.id, role: user.role })
                            // myUserService.redisSetUserData(token, moment(moment().add(48, "hours")).fromNow_seconds())
                            req.session.auth = token;
                            if (!uniqueGCM) {
                                user = await myUserService.findOneAndUpdate(
                                    { id: user.id },
                                    { gcm: { create: [{ id: gcm_id, platform }] } }
                                )
                            }
                            let success = {
                                success: true,
                                msg: "Logged in successfully. Please complete your profile.",
                                data: user,
                                status: 201,
                                raw: { existing: false, approved: false }
                            }
                            if (existing && !approved) {
                                success.status = 206
                                success.raw = { existing: true, approved: false }
                            }
                            if (existing && approved) {
                                myUserService.redisUpdateUser(user)
                                success.msg = "Logged in successfully."
                                success.status = 200
                                success.raw = { existing: true, approved: true }
                            }
                            SenderService.send(res, success);
                            return;
                        }
                    })
                })
                .catch(error => {
                    SenderService.errorSend(res, { success: false, msg: "There was an error in verifying SMS code", raw: error.message, status: 500 });
                })
        } catch (error) {
            SenderService.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }

    async logout(req, res) {
        try {
            const myUserService = new UserService()
            myUserService.findOneAndUpdate(
                { id: req.user.id },
                { gcm: { deleteMany: [{ id: req.body.gcm_id }] }, }
            ).then((_user) => {
                req.session.cookie.maxAge = 10;
                SenderService.send(res, { success: true, msg: "Logged out successfully", status: 200 });
            }).catch((error) => {
                SenderService.errorSend(res, { success: false, msg: error.message, status: 500 });
            });
        } catch (error) {
            SenderService.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
}
