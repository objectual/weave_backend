import compose from "composable-middleware"
import { Validator } from "../controller/validate";
export class ValidationMiddleware extends Validator {
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
                            };
                            res.status(400).send(errors);
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
                            };
                            res.status(400).send(errors);
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
                            };
                            res.status(400).send(errors);
                            return;
                        })
                })
        )
    }
    validateUserUpdate() {
        return (
            compose()
                .use((req, res, next) => {
                    super.validateUserUpdateData(req.body)
                        .then(data => {
                            next();
                        }).catch(error => {
                            var errors = {
                                success: false,
                                msg: error.details[0].message,
                                data: error.name,
                            };
                            res.status(400).send(errors);
                            return;
                        })
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
                            };
                            res.status(400).send(errors);
                            return;
                        })
                })
        )
    }

    validateConnectionFollow() {
        return (
            compose()
                .use((req, res, next) => {
                    super.validateConnectionFollowData(req.body)
                        .then(data => {
                            req.body.userId = req.user.id;
                            next();
                        }).catch(error => {
                            console.log(error)
                            var errors = {
                                success: false,
                                msg: error.details[0].message,
                                data: error.name,
                            };
                            res.status(400).send(errors);
                            return;
                        })
                })
                .use((req, res, next) => {
                    if (req.body.userId == req.body.followId) {
                        res.status(409).send({ success: false, msg: "Not allowed to perform this action" })
                    }else{
                        next();
                    }
                })
        )
    }
}
