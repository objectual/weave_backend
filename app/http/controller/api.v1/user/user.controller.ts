import * as _ from "lodash";
import * as fs from "fs";
import moment from "../../../../modules/moment";
import { UserService } from "../../../services/user.service";
import { Sender } from "../../../services/sender.service";
import { IUserEdit } from "../../../models/user.model";
import { Cloudinary, ICloudinaryUpload } from "../../../../constants/cloudinary";
import { ImageService } from "../../../services/image.service";
export class User {
    userService: UserService;
    imageService: ImageService;
    constructor() {
        this.userService = new UserService();
        this.imageService = new ImageService();
    }
    async get(req, res) {
        try {
            let limit = _.toInteger(req.query.limit);
            let page = _.toInteger(req.query.page);
            let { key, id } = req.query;
            if (id != null && id != "" && id != undefined) {
                let user = await this.userService.findOne({ id })
                this.userService.redisUpdateUser(user);
                res.send({
                    success: true, user: user.profile
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
                let { users, count } = await this.userService.findWithLimit(query, limit, page)
                let user_profiles = users.map(x => x.profile)
                users.map(user => this.userService.redisUpdateUser(user))
                Sender.send(res, {
                    success: true, data: user_profiles,
                    raw: req.user,
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

    async update(req, res) {
        try {
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
            let updatedUser = await this.userService.findOneAndUpdate({ id: req.user.id }, user)
            if (req.user.data.profile.approved == false && updatedUser.profile.firstName != null && updatedUser.profile.lastName != null && updatedUser.profile.about != null && updatedUser.profile.profileImage != null) {
                updatedUser = await this.userService.findOneAndUpdate({ id: req.user.id }, { profile: { update: { approved: true } } })
                this.userService.redisUpdateUser(updatedUser) // this only works once because the profile is approved after registrations
            }
            if (req.user.data.profile.approved) {
                this.userService.redisUpdateUser(updatedUser)
            }
            Sender.send(res, {
                status: 200, success: true, data: updatedUser, msg: "User updated successfully"
            });
        } catch (error) {
            Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }

    async uploader(req, res) {
        try {
            let { files, alreadyUploaded } = req.body;
            const image: any = async (path, name) => { // MIN 
                return await Cloudinary.uploads(path, `${req.user.id}/${name}`);
            }
            if (files != null && files.length != 0) {
                if (files.length > Math.abs(3 - alreadyUploaded)) {
                    Sender.errorSend(res, { success: false, status: 409, msg: `Your profile already has ${alreadyUploaded} images uploaded. Cannot upload more than ${Math.abs(3 - alreadyUploaded)} images on your profile` })
                    files.map(file => {
                        fs.unlink(file, () => { console.log(`Deleted ${file}`) });
                    })
                } else {
                    let images: ICloudinaryUpload[] = await Promise.all(files.map(async file => {
                        let pathSplit = file.split('\\')[2].split('.').slice(0, -1).join('.')
                        const imgURL = await image(file, pathSplit);
                        fs.unlink(file, () => { console.log(`Deleted ${file}`) });
                        return imgURL;
                    }))
                    Sender.send(res, { success: true, data: await this.imageService.create(images.map(i => { return { cloudinaryId: i.id, path: i.path, userId: req.user.id } })), msg: "Images uploaded", status: 201 })
                }
            } else {
                Sender.errorSend(res, { success: false, status: 400, msg: "Files not found" })
            }

        } catch (error) {
            Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }

    async getImages(req, res) {
        try {
            Sender.send(res, { success: true, data: await this.imageService.find({ userId: req.params.id, type: "USER" }), status: 200 })
        } catch (error) {
            Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
    async imageRemove(req, res) {
        try {
            const image: any = async (path) => { // MINI Function 
                return await Cloudinary.remove(path);
            }
            const deletedImage = await this.imageService.findOne({ id: req.body.id, userId: req.user.id, type: "USER" })
            await image(deletedImage.cloudinaryId);
            Sender.send(res, { success: true, msg: "Image deleted", data: await this.imageService.delete({ userId: req.user.id, type: "USER", id: req.body.id }), status: 200 })
        } catch (error) {
            Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
}
