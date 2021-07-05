import * as _ from "lodash";
import moment from "../../../../../modules/moment";
import { UserService } from "../../../../services/user.service";
import { Sender } from "../../../../services/sender.service";
import { IUserEdit } from "../../../../models/user.model";
import { Request, Response } from "express"

export class User {
    async get(req:Request, res:Response) {
        try {
            const userService = new UserService();
            let limit = _.toInteger(req.query.limit);
            let page = _.toInteger(req.query.page);
            let { key, id } = req.query;
            if (id != null && id != "" && id != undefined) {
                let user = await userService.findOneAdmin({ id })
                res.send({
                    success: true, user: user
                })
                return;
            } else {
                let query = { blocked: false, role: "USER", profile: { approved: true } }
                if (key != null && key != "") {
                    let orQuery = [
                        { email: { contains: key, mode: "insensitive", } },
                        { profile: { firstName: { contains: key, mode: "insensitive", } } },
                        { profile: { lastName: { contains: key, mode: "insensitive", } } }
                    ]
                    query['OR'] = orQuery;
                }
                let { users, count } = await userService.findWithLimitAdmin(query, limit, page)
                Sender.send(res, {
                    success: true, data: users,
                    raw: req['user'],
                    page: page,
                    pages: Math.ceil(count / limit),
                    count,
                    status: 200
                });
            }
        } catch (error) {
            Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
    async update(req:Request, res:Response) {
        try {
            const userService = new UserService();
            let update = req.body;
            if (req.body.birthday != null && req.body.birthday != "") {
                if (!moment(req.body.birthday).olderThan14()) {
                    Sender.errorSend(res, { success: false, msg: "You must be older than 14 years to use the app", status: 400 });
                    return;
                } else {
                    update['birthday'] = moment(req.body.birthday).format()
                }
            }
            update['city'] = update.city.toLowerCase();
            update['country'] = update.country.toLowerCase();
            let user: IUserEdit = {
                profile: {
                    update
                }
            }
            if (req.body.blocked != null && req.body.blocked != "") {
                user.blocked = req.body.blocked
            }
            let updatedUser = await userService.findOneAndUpdate({ id: req.params.id }, user)
            if (updatedUser.profile.approved == false && updatedUser.profile.birthday != null && updatedUser.profile.firstName != null && updatedUser.profile.lastName != null && updatedUser.profile.about != null && updatedUser.profile.profileImage != null) {
                updatedUser = await userService.findOneAndUpdate({ id: req.params.id }, { user: { profile: { approved: true } } })
            }
            if (updatedUser.profile.approved) {
                userService.redisUpdateUser(updatedUser)
            }
            Sender.send(res, {
                status: 204, success: true, data: updatedUser, msg: "User updated successfully"
            });
        } catch (error) {
            Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
}