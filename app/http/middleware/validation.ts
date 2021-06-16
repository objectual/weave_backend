import compose from "composable-middleware"
import { Validator } from "../controller/validate";
import { ValidateBlocked, ValidateFriends } from "../models/connection.model";
import { ValidateImages } from "../models/images.user.model";
import { Sender } from "../services/sender.service";
import * as _ from "lodash"
export const ValidationMiddleware = new class ValidationMiddleware extends Validator {
    constructor() {
        super();
    }
    validateUserRegistration() {
        return (
            compose()
                .use((req, res, next) => {
                    super.validateRegisterData(req.body)
                        .then(data => {
                            next();
                        }).catch(error => {
                            var errors = {
                                success: false,
                                msg: error.details[0].message,
                                data: error.name,
                                status: 400
                            };
                            Sender.errorSend(res, errors);
                            return;
                        });
                })
        )
    }
    validateUserVerify() {
        return (
            compose()
                .use((req, res, next) => {
                    super.validateVerifyData(req.body)
                        .then(data => {
                            next();
                        }).catch(error => {
                            var errors = {
                                success: false,
                                msg: error.details[0].message,
                                data: error.name,
                                status: 400
                            };
                            Sender.errorSend(res, errors);
                            return;
                        });
                })
        )
    }
    validateUserLogin() {
        return (
            compose()
                .use((req, res, next) => {
                    super.validateLoginData(req.body)
                        .then(data => {
                            next();
                        }).catch(error => {
                            var errors = {
                                success: false,
                                msg: error.details[0].message,
                                data: error.name,
                                status: 400
                            };
                            Sender.errorSend(res, errors);
                            return;
                        })
                })
        )
    }
    validateUserUpdate() {
        return (
            compose()
                .use((req, res, next) => {
                    if (req.user.data.profile.approved == false) {
                        super.validateUserUpdateDataRequired(req.body)
                            .then(data => {
                                next();
                            }).catch(error => {
                                var errors = {
                                    success: false,
                                    msg: error.details[0].message,
                                    data: error.name,
                                    status: 400
                                };
                                Sender.errorSend(res, errors);
                                return;
                            })
                    } else {
                        super.validateUserUpdateData(req.body)
                            .then(data => {
                                next();
                            }).catch(error => {
                                var errors = {
                                    success: false,
                                    msg: error.details[0].message,
                                    data: error.name,
                                    status: 400
                                };
                                Sender.errorSend(res, errors);
                                return;
                            })
                    }
                })
        )
    }

    validateAdminUserUpdate() {
        return (
            compose()
                .use((req, res, next) => {
                    super.validateAdminUserUpdateData(req.body)
                        .then(data => {
                            next();
                        }).catch(error => {
                            var errors = {
                                success: false,
                                msg: error.details[0].message,
                                data: error.name,
                                status: 400
                            };
                            Sender.errorSend(res, errors);
                            return;
                        })
                })
        )
    }

    validateUserImageCount() {
        return (
            compose()
                .use((req, res, next) => {
                    const validateImages = new ValidateImages();
                    validateImages.validate(req.user.id, {
                        error: (msg) => Sender.errorSend(res, { success: false, status: 409, msg }),
                        next: (count) => { req.body.alreadyUploaded = count; next() }
                    })
                })
        )
    }

    validateFriendRequest() {
        return (
            compose()
                .use((req, res, next) => {
                    super.validateUserFriendRequest(req.body)
                        .then(data => {
                            next();
                        }).catch(error => {
                            var errors = {
                                success: false,
                                msg: error.details[0].message,
                                data: error.name,
                                status: 400
                            };
                            Sender.errorSend(res, errors);
                            return;
                        })
                })
                .use((req, res, next) => {
                    if (req.body.friend == req.user.id) {
                        Sender.errorSend(res, { success: false, status: 400, msg: "Cannot send friend request" })
                    }
                    next();
                })
                .use((req, res, next) => {
                    const validateFriends = new ValidateFriends();
                    validateFriends.validate(req.body.friend, req.user.id, {
                        error: (msg) => Sender.errorSend(res, { success: false, status: 409, msg }),
                        next: () => next()
                    })
                })
                .use((req, res, next) => {
                    let checkInMyList = _.indexOf(req.user.data.blockedByMe, req.body.friend)
                    let checkInOthersList = _.indexOf(req.user.data.blockedByOthers, req.body.friend)
                    if (checkInMyList != -1 && checkInOthersList != -1) {
                        next();
                    }
                    Sender.errorSend(res, { success: false, status: 409, msg: "Cannot send friend request" })
                })
        )
    }

    validateFriendRequestUpdate() {
        return (
            compose()
                .use((req, res, next) => {
                    super.validateUserFriendRequestUpdate({ id: req.params.id, approved: req.body.approved })
                        .then(data => {
                            next();
                        }).catch(error => {
                            var errors = {
                                success: false,
                                msg: error.details[0].message,
                                data: error.name,
                                status: 400
                            };
                            Sender.errorSend(res, errors);
                            return;
                        })
                })
        )
    }

    blockedUsersList() {
        return (
            compose()
                .use((req, res, next) => {
                    // Attaches blocked users in both list to the request
                    const validateBlocked = new ValidateBlocked();
                    validateBlocked.userInBlockList(req.user.id, {
                        error: (msg) => Sender.errorSend(res, { success: false, status: 409, msg }),
                        next: (blockedObject) => {
                            if (blockedObject != null) {
                                req.user.data.blockedByMe = blockedObject.blockedByMe // users I blocked
                                req.user.data.blockedByOthers = blockedObject.blockedByOthers // users who blocked me 
                            }
                            next()
                        }
                    })
                })
        )
    }

    validateBlockedRequest() {
        return (
            compose()
                .use((req, res, next) => {
                    super.validateUserBlockRequest(req.body)
                        .then(data => {
                            next();
                        }).catch(error => {
                            var errors = {
                                success: false,
                                msg: error.details[0].message,
                                data: error.name,
                                status: 400
                            };
                            Sender.errorSend(res, errors);
                            return;
                        })
                })
                .use((req, res, next) => {
                    if (req.body.user == req.user.id) {
                        Sender.errorSend(res, { success: false, status: 400, msg: "Cannot block user" })
                    }
                    next();
                })
                .use((req, res, next) => {
                    const validateBlocked = new ValidateBlocked();
                    validateBlocked.validate(req.body.user, req.user.id, {
                        error: (msg) => Sender.errorSend(res, { success: false, status: 409, msg }),
                        next: () => next()
                    })
                })
        )
    }

    validateEventCreate() {
        return (
            compose()
                .use((req, res, next) => {
                    super.validateUserFriendRequestUpdate({ id: req.params.id, approved: req.body.approved })
                        .then(data => {
                            next();
                        }).catch(error => {
                            var errors = {
                                success: false,
                                msg: error.details[0].message,
                                data: error.name,
                                status: 400
                            };
                            Sender.errorSend(res, errors);
                            return;
                        })
                })
        )
    }

}
