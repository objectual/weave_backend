import { Request, Response } from "express"
import { ChatRoomService } from "../../../services/chat.service";
import { Sender } from "../../../services/sender.service";
import * as _ from "lodash"
import { IRoomCreate, IRoomUpdate } from "../../../models/room.model";
import { ImageService } from "../../../services/image.service";
import { Cloudinary, ICloudinaryUpload } from "../../../../constants/cloudinary";
import fs from "fs";
import { KafkaService, Messages } from "../../../services/kafka.service";
import { UserService } from "../../../services/user.service";

export class Group {
    async get(req: Request, res: Response) {
        try {
            let limit = _.toInteger(req.query.limit);
            let page = _.toInteger(req.query.page);
            const roomService = new ChatRoomService();
            if (req.query.id != null && req.query.id != undefined && req.query.id != "") {
                let event = await roomService.findOne({ id: req.query.id })
                Sender.send(res, { success: true, data: event, status: 200 })
            } else {
                let orQuery = [
                    { userId: req['user'].id },
                    {
                        members: {
                            some: {
                                id: {
                                    contains: req['user'].id,
                                },
                            },
                        }
                    }
                ]
                let { rooms, count } = await roomService.findWithLimit({ OR: orQuery }, limit, page)
                Sender.send(res, { success: true, data: rooms, count, page, pages: Math.ceil(count / limit), status: 200 })
            }
        } catch (e) {
            Sender.errorSend(res, { success: false, msg: e.message, status: 500 })
        }
    }
    async post(req: Request, res: Response) {
        try {
            // YOU CAN'T ADD THE IMAGES BLOCK IN THE FORM DATA BECAUSE IT WON'T PROCESS THE MEMBERS LIST
            let body: IRoomCreate = {
                name: req.body.name,
                description: req.body.description,
                owner: { connect: { id: req['user'].id } },
                members: { connect: [...req.body.admins.map(x => { return { id: x } }),...req.body.members.map(x => { return { id: x } }), { id: req['user'].id }] },
                admins: { connect: req.body.admins.map(x => { return { id: x } }) },
                image: {
                    create: {
                        type: 'CHAT',
                        cloudinaryId: "DEFAULT",
                        path: "https://res.cloudinary.com/weavemasology/image/upload/v1627207902/images/customers-icon-29_c00nge.png"
                    }
                }
            }
            const roomService = new ChatRoomService();
            let room = await roomService.create(body);

            // NOTIFY MEMBERS AND ADMINS ABOUT NEW GROUP
            const kafkaService = new KafkaService();
            let ids = _.uniq([body.owner.connect.id, ...body.admins.connect.map(a => a.id), ...body.members.connect.map(m => m.id)])
            const messagesService = new Messages(`Group created by ${room.owner.profile.phoneNo}`)
            let messages = await messagesService.getEncryptedMessages(ids, room.id).then(messages => messages)
            kafkaService.producer(messages)
            // NOTIFIER END

            Sender.send(res, { success: true, data: room, status: 201, msg: "Room created" })
        } catch (e) {
            Sender.errorSend(res, { success: false, msg: e.message, status: 500 })
        }
    }
    async patch(req: Request, res: Response) {
        try {
            const roomService = new ChatRoomService();
            const userService = new UserService();

            let old_room = await roomService.findOne({ id: req.params.id })
            if (old_room == null) {
                Sender.errorSend(res, { success: false, msg: "Group chat room not found", status: 400 });
                return;
            }
            const kafkaService = new KafkaService();
            let body: IRoomUpdate = {
                name: req.body.name,
                description: req.body.name,
                admins: {},
                members: {},
            }

            // For some expert reason, I am sending the notifier like this because the notifier function is not mature enough
            // Don't bother but if you do figure it out, do it.

            let messages = []
            if (req.body.members != null && req.body.members.connect != null && req.body.members.connect.id.length > 0 && (_.includes(req['room'].admins, req['user'].id) || req['room'].owner.profile.userId == req['user'].id)) {
                body.members['connect'] = req.body.members.connect.id.map(x => { return { id: x } })
                if (old_room.members.length > 0) {
                    body.members['connect'] = req.body.members.connect.id.map(x => { return { id: x } }).filter(function (idObject) {
                        // Skip connections of users who are already in room
                        return !_.find(old_room.members, function (o) { return o.profile.userId == idObject.id; });
                    });
                }
                if (body.members.connect.length > 0) {
                    // Notify Users of new group members
                    let newUsers = await userService.find({
                        id: {
                            in: body.members['connect']
                                .map(x => x.id)
                        }
                    })
                    newUsers.users
                        .map(user => { return `${user.profile.phoneNo} is added to group by ${req['user'].data.profile.phoneNo}` })
                        .forEach(message => messages.push(message))
                }
            } else if (req.body.members != null && req.body.members.disconnect != null && req.body.members.disconnect.id.length > 0 && (_.includes(req['room'].admins, req['user'].id) || req['room'].owner.profile.userId == req['user'].id)) {
                // When user is removed from group, that user is also removed from admin by default
                body.admins['disconnect'] = [...req.body.members.disconnect.id.map(x => { return { id: x } })]

                body.members['disconnect'] = req.body.members.disconnect.id.map(x => { return { id: x } })
                if (old_room.members.length > 0) {
                    body.members['disconnect'] = req.body.members.disconnect.id.map(x => { return { id: x } }).filter(function (idObject) {
                        // Skip connections of users who are already in room
                        return _.find(old_room.members, function (o) { return o.profile.userId == idObject.id; });
                    });
                }
                if (body.members.disconnect.length > 0) {
                    // Notify Deleting users of old group members
                    let oldUsers = await userService.find({
                        id: {
                            in: body.members['disconnect']
                                .map(x => x.id)
                        }
                    })
                    oldUsers.users
                        .map(user => { return `${user.profile.phoneNo} is removed from group by ${req['user'].data.profile.phoneNo}` })
                        .forEach(message => messages.push(message))
                }
            }

            if (req.body.admins != null && req.body.admins.connect != null && req.body.admins.connect.id.length > 0 && req['room'].owner.profile.userId == req['user'].id) {
                body.admins['connect'] = req.body.admins.connect.id.map(x => { return { id: x } })
                if (old_room.admins.length > 0) {
                    body.admins['connect'] = req.body.admins.connect.id.map(x => { return { id: x } }).filter(function (idObject) {
                        // Skip connections of users who are already in room
                        return !_.find(old_room.admins, function (o) { return o.profile.userId == idObject.id; });
                    });
                }
                if (body.admins.connect.length > 0) {
                    // Notify new admin to members
                    let newAdmins = await userService.find({
                        id: {
                            in: body.admins['connect']
                                .map(x => x.id)
                        }
                    })
                    newAdmins.users
                        .map(user => { return `${user.profile.phoneNo} is made admin by ${req['user'].data.profile.phoneNo}` })
                        .forEach(message => messages.push(message))
                }
            } else if (req.body.admins != null && req.body.admins.disconnect != null && req.body.admins.disconnect.id.length > 0 && req['room'].owner.profile.userId == req['user'].id) {
                body.admins['disconnect'] = [...req.body.admins.disconnect.id.map(x => { return { id: x } })]
                if (old_room.admins.length > 0) {
                    body.admins['disconnect'] = [...req.body.admins.disconnect.id.map(x => { return { id: x } }).filter(function (idObject) {
                        // Skip connections of users who are already in room
                        return _.find(old_room.admins, function (o) { return o.profile.userId == idObject.id; });
                    })]
                }
                if (body.admins.disconnect.length > 0) {
                    // Notify removed admin to members
                    let oldAdmins = await userService.find({
                        id: {
                            in: body.admins['disconnect']
                                .map(x => x.id)
                        }
                    })
                    oldAdmins.users
                        .map(user => { return `${user.profile.phoneNo} is removed from admin by ${req['user'].data.profile.phoneNo}` })
                        .forEach(message => messages.push(message))
                }
            }
            let room = await roomService.update({ id: req.params.id }, body);

            let ids = _.uniq([old_room.owner.profile.userId, ...old_room.members.map(a => a.profile.userId), ...room.members.map(a => a.profile.userId)])
            if (messages.length > 0) {
                Promise.all(
                    messages.map(x => new Messages(x).getEncryptedMessages(ids, old_room.id).then(messages => messages))
                )
                    .then(kmessages => {
                        kafkaService.producer(kmessages.flat())
                    })
            }
            Sender.send(res, { success: true, data: room, status: 201, msg: "Group updated" })
        }
        catch (error) {
            Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
    async delete(req: Request, res: Response) {
        try {
            const roomService = new ChatRoomService();
            let room = await roomService.findOne({ id: req.params.id, userId: req['user'].id })
            if (room == null) {
                Sender.errorSend(res, { success: false, status: 409, msg: "Only group owner can remove group" })
                return;
            }
            let roomDelete = await roomService.delete({ id: req.params.id, userId: req['user'].id })
            // Notify all members of group delete update 
            const kafkaService = new KafkaService();
            let ids = _.uniq([room.owner.profile.userId, ...room.members.map(a => a.profile.userId)])
            const messagesService = new Messages(`${req['user'].data.profile.phoneNo} deleted group`)
            let messages = await messagesService.getEncryptedMessages(ids, room.id).then(messages => messages)
            kafkaService.producer(messages)
            // NOTIFIER END
            Sender.send(res, { success: true, data: roomDelete, msg: "Room removed", status: 200 })
        }
        catch (error) {
            Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
    async leave(req: Request, res: Response) {
        try {
            const roomService = new ChatRoomService();
            let body = {
                admins: {},
                members: {}
            }
            let room = await roomService.findOne({ id: req.params.id })
            if (room.owner.profile.userId == req['user'].id) {
                Sender.errorSend(res, { success: false, status: 409, msg: "Group owner cannot exit room" })
                return;
            } else {
                body.admins['disconnect'] = [{ id: req['user'].id }]
                body.members['disconnect'] = [{ id: req['user'].id }]
                // Notify Users of group member leave

                let roomUpdate = await roomService.update({ id: req.params.id }, body);
                // NOTIFY MEMBERS AND ADMINS ABOUT USER LEAVE
                const kafkaService = new KafkaService();
                let ids = _.uniq([roomUpdate.owner.profile.userId, ...roomUpdate.members.map(a => a.profile.userId)])
                const messagesService = new Messages(`${req['user'].data.profile.phoneNo} left group`)
                let messages = await messagesService.getEncryptedMessages(ids, roomUpdate.id).then(messages => messages)
                kafkaService.producer(messages)
                // NOTIFIER END
                Sender.send(res, { success: true, data: roomUpdate, status: 200, msg: "Group updated" })
            }
        }
        catch (error) {
            Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
    async uploader(req: Request, res: Response) {
        try {
            const roomService = new ChatRoomService();
            let { files } = req.body;
            const image: any = async (path, name) => { // MIN 
                return await Cloudinary.uploads(path, `chatrooms/${req.params.id}`);
            }
            if (files != null && files.length != 0) {
                console.log("Starting upload")
                let images: ICloudinaryUpload[] = await Promise.all(files.map(async file => {
                    let pathSplit = file.split('\\')[2].split('.').slice(0, -1).join('.')
                    const imgURL = await image(file, pathSplit);
                    fs.unlink(file, () => { console.log(`Deleted ${file}`) });
                    return imgURL;
                }))
                if (!image) { return Sender.errorSend(res, { success: false, status: 500, msg: "Something Went Wrong" }) }
                let uploadImages = await roomService.update({ id: req.params.id }, { image: { update: { cloudinaryId: images[0].id, path: images[0].path } } })
                Sender.send(res, { success: true, data: uploadImages, msg: "Image uploaded", status: 201 })

            } else {
                Sender.errorSend(res, { success: false, status: 400, msg: "File not found" })
            }
        } catch (error) {
            Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }

    // async getImages(req: Request, res: Response) {
    //     try {
    //         const imageService = new ImageService();
    //         Sender.send(res, { success: true, data: await imageService.find({ roomId: req.params.id, type: "CHAT" }), status: 200 })
    //     } catch (error) {
    //         Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
    //     }
    // }
    // async imageRemove(req: Request, res: Response) {
    //     try {
    //         const roomService = new ChatRoomService();
    //         const imageService = new ImageService();
    //         const image: any = async (path) => { // MINI Function 
    //             return await Cloudinary.remove(path);
    //         }
    //         const deletedRoomImage = await roomService.findOne({ id: req.body.id, image: { roomId: req.body.id, type: "CHAT" } })
    //         if (deletedRoomImage.owner.profile.userId != req['user'].id) {
    //             Sender.errorSend(res, { success: false, msg: "Only group owner can delete room", status: 409 });
    //             return;
    //         } else {
    //             await image(deletedRoomImage);
    //             Sender.send(res, { success: true, msg: "Image deleted", data: await imageService.delete({ image: { roomId: req.body.id, type: "CHAT" }, id: req.params.id }), status: 200 })
    //         }
    //     } catch (error) {
    //         Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
    //     }
    // }
}