import * as _ from "lodash";
import moment from "../../../../../modules/moment";
import { UserService } from "../../../../services/user.service";
import { RedisService } from "../../../../../cache/redis.service";
import { AuthService } from "../../../../services/auth.service";
import { IProfile, ValidateProfile } from "../../../../models/profile.user.model";
import { SenderService } from "../../../../services/sender.service";
import short from 'short-uuid';
import { IUser, IUserCreateProfile, IUserEdit, IUserProfile, ValidateUser } from "../../../../models/user.model";
export class User extends RedisService {
    constructor() {
        super();
    }

    async update(req, res) {
        try {
            const { name, about, blocked, email } = JSON.parse(JSON.stringify(req.body));
            let user: IUserEdit = {
                email,
                blocked: (blocked == 'true'),
            }
            if (name != null || about != null) {
                user['profile'] = {
                    update: {
                        name,
                        about,
                    }
                }
            }
            const myUserService = new UserService();
            myUserService
                .findOneAndUpdate({ id: req.body.id }, user)
                .then((user) => {
                    super.setData(user.profile, `${user.profile.name}|${user.profile.phoneNo}|${user.profile.userId}|user`, 0).catch((error) => { throw error })
                    SenderService.send(res, {
                        success: true, data: user, msg: "User updated successfully", status: 200
                    });
                })
                .catch((error) => {
                    SenderService.errorSend(res, { success: false, raw: error.message, status: 500 });

                });
        } catch (error) {
            SenderService.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
}