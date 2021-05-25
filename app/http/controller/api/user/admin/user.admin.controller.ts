import * as _ from "lodash";
import moment from "../../../../../modules/moment";
import { UserService } from "../../../../services/user.service";
import { RedisService } from "../../../../../cache/redis.service";
import { AuthService } from "../../../../services/auth.service";
import { IProfile, ValidateProfile } from "../../../../models/profile.user.model";
import { ErrorService } from "../../../../services/error.service";
import short from 'short-uuid';
import { IUser, IUserCreateProfile, IUserEdit, IUserProfile, ValidateUser } from "../../../../models/user.model";
export class User extends RedisService {
    constructor() {
        super();
    }

    async update(req, res) {
        try {
            const { username, name, about, blocked, email } = JSON.parse(JSON.stringify(req.body));
            let user: IUserEdit = {
                email,
                blocked: (blocked == 'true'),
            }
            if (username != null || name != null || about != null) {
                user['profile'] = {
                    update: {
                        username,
                        name,
                        about,
                    }
                }
            } 
            const myUserService = new UserService();
            myUserService
                .findOneAndUpdate({ id: req.body.id }, user)
                .then((user) => {
                    super.setData(user.profile, `${user.profile.username}|${user.profile.name}|${user.profile.phoneNo}|${user.profile.userId}|user`, 0).catch((error) => { throw error })
                    res.send({
                        success: true, user, msg: "User updated successfully"
                    });
                })
                .catch((error) => {
                    ErrorService.handler(res, 500, { success: false, raw: error.message, status: 500 });

                });
        } catch (error) {
            res.status(500).send({ success: false, msg: error.message });
        }
    }
}