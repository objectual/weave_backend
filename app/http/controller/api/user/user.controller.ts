import * as _ from "lodash";
import * as fs from "fs";
import moment from "../../../../modules/moment";
import { UserService } from "../../../services/user.service";
import { RedisService } from "../../../../cache/redis.service";
import { AuthService } from "../../../services/auth.service";
import { IProfile, IProfileCreate, ValidateProfile } from "../../../models/profile.user.model";
import { SenderService } from "../../../services/sender.service";
import short from 'short-uuid';
import { IUser, IUserCreateProfile, IUserEdit, IUserProfile, ValidateUser } from "../../../models/user.model";
import { Cloudinary } from "../../../../constants/cloudinary";
export class User extends RedisService {
    constructor() {
        super();
    }
    async get(req, res) {
        try {
            let limit = _.toInteger(req.query.limit);
            let page = _.toInteger(req.query.page);
            let { key, id } = req.query;
            let myUserService = new UserService();
            if (id != null && id != "" && id != undefined) {
                let user = await myUserService.findOne({ id })
                myUserService.redisUpdateUser(user);
                res.send({
                    success: true, user: user.profile
                })
            } else {
                let orQuery = [
                    { email: { contains: key, mode: "insensitive", } },
                    { profile: { name: { contains: key, mode: "insensitive", } } }
                ]
                let { users, count } = await myUserService.findWithLimit({ blocked: false, role: "USER", OR: orQuery }, limit, page)
                let user_profiles = users.map(x => x.profile)
                users.map(user => myUserService.redisUpdateUser(user))
                SenderService.send(res, {
                    success: true, data: user_profiles,
                    raw:req.user,
                    page: page,
                    pages: Math.ceil(count / limit),
                    count,
                    status: 200
                });
            }
        } catch (error) {
            SenderService.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }

    // async update(req, res) {
    //     try {
    //         const { username, name, about } = JSON.parse(JSON.stringify(req.body));
    //         const files = JSON.parse(JSON.stringify(req.files));
    //         console.log(username, name, about)
    //         let user: IUserEdit = {
    //             profile: {
    //                 update: { 
    //                     name,
    //                     about,
    //                 }
    //             }
    //         }
    //         if (files.image != null) {
    //             const file = files.image;
    //             const image: any = async (path) => {
    //                 const cloudinary = new Cloudinary()
    //                 return await cloudinary.uploads(path, "image");
    //             }
    //             const { path } = file[0];
    //             const imgURL = await image(path);
    //             fs.unlink(path, () => { console.log(`Deleted ${path}`) });
    //             user.profile.update["profileImage"] = imgURL.url;
    //         }

    //         const myUserService = new UserService();
    //         let updatedUser = await myUserService.findOneAndUpdate({ id: req.user.id }, user)
    //         myUserService.redisUpdateUser(updatedUser)
    //         res.send({
    //             success: true, user: updatedUser, msg: "User updated successfully"
    //         });
    //     } catch (error) {
    //         ErrorService.handler(res, 500, { success: false, msg: error.message, status: 500 });
    //     }
    // }
}
