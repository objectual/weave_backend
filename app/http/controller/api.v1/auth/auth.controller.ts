import * as _ from "lodash";
import { UserService } from "../../../services/user.service";
import { AuthService } from "../../../services/auth.service";
import { IProfileCreate, ValidateProfile } from "../../../models/profile.user.model";
import { Sender } from "../../../services/sender.service";
import { ValidateUser } from "../../../models/user.model";

export class Authentication {
    userService: UserService;
    userValidationService: ValidateUser;
    profileValidateService: ValidateProfile;
    constructor() {
        this.userService = new UserService();
        this.profileValidateService = new ValidateProfile();
        this.userValidationService = new ValidateUser();
    }
    login(req, res) {
        try {
            let { phoneNo } = req.body;
            this.userService.sendCode(phoneNo)
                .then(message => {
                    Sender.send(res, { success: true, msg: "Verification code sent to your phone number", status: 200 });
                }).catch((error) => {
                    Sender.errorSend(res, { success: false, msg: "There was an error in verifying SMS code", raw: error.message, status: 500 });
                })
        } catch (error) {
            Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }

    async verify(req, res) {
        try {
            let { phoneNo, code, gcm_id, platform } = req.body
            await this.userService.checkCode(phoneNo, code)
                .then(async user => {
                    let existing = false;
                    let approved = false;
                    if (user == null) {
                        await this.profileValidateService.validate({ phoneNo }, {
                            error: message => Sender.errorSend(res, { success: false, msg: message, status: 400 }),
                            next: async (profile: IProfileCreate) => {
                                let _newUser = { profile: { create: profile } }
                                user = await this.userService.create(_newUser, profile);
                                existing = false;
                                approved = false;
                            }
                        })
                    } else if (user != null) {
                        if (user.blocked) {
                            Sender.errorSend(res, { success: false, msg: "There was an error logging in. Your account has been suspended", status: 409 });
                            return;
                        } else if (!user.blocked && !user.profile.approved) {
                            existing = true; approved = false
                        } else if (!user.blocked && user.profile.approved) {
                            existing = true; approved = true
                        }
                    }
                    await this.userValidationService.validateGCM(user, gcm_id, {
                        error: message => Sender.errorSend(res, { success: false, msg: message, status: 400 }),
                        next: async uniqueGCM => {
                            let token = await AuthService.generateAuthToken({ id: user.id, role: user.role })
                            // myUserService.redisSetUserData(token, moment(moment().add(48, "hours")).fromNow_seconds())
                            req.session.auth = token;
                            if (!uniqueGCM) {
                                user = await this.userService.findOneAndUpdate(
                                    { id: user.id },
                                    { gcm: { create: [{ id: gcm_id, platform }] } }
                                )
                            }
                            // Stuff I don't want to leave in redis
                            delete user.blocked;
                            delete user.profile.approved;
                            delete user.profile.userId;
                            delete user.profile.createdAt;
                            delete user.profile.updatedAt;
                            delete user.gcm;
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
                                this.userService.redisUpdateUser(user)
                                success.msg = "Logged in successfully."
                                success.status = 200
                                success.raw = { existing: true, approved: true }
                            }
                            Sender.send(res, success);
                            return;
                        }
                    })
                })
                .catch(error => {
                    Sender.errorSend(res, { success: false, msg: "There was an error in verifying SMS code", raw: error.message, status: 500 });
                })
        } catch (error) {
            Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }

    async logout(req, res) {
        try {
            this.userService.findOneAndUpdate(
                { id: req.user.id },
                { gcm: { deleteMany: [{ id: req.body.gcm_id }] }, }
            ).then((_user) => {
                req.session.cookie.maxAge = 10;
                Sender.send(res, { success: true, msg: "Logged out successfully", status: 200 });
            }).catch((error) => {
                Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
            });
        } catch (error) {
            Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
}
