import * as _ from "lodash";
import { BlockedService, FriendsService } from "../../../services/connection.service";
import { Sender } from "../../../services/sender.service";
export class Connection {
    async getFriends(req, res) {
        try {
            let limit = _.toInteger(req.query.limit);
            let page = _.toInteger(req.query.page);
            const friendsService = new FriendsService();
            let orQuery = [
                { userId: req.user.id, approved: true },
                { friendId: req.user.id, approved: true },
            ]
            let { friends, count } = await friendsService.findWithLimit({ OR: orQuery }, limit, page)
            Sender.send(res, { success: true, data: friends, count, page, pages: Math.ceil(count / limit), status: 200 })
        } catch (error) {
            Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
    async getFriendRequests(req, res) {
        try {
            let limit = _.toInteger(req.query.limit);
            let page = _.toInteger(req.query.page);
            const friendsService = new FriendsService();
            let { friends, count } = await friendsService.findWithLimit({ friendId: req.user.id, approved: false }, limit, page)
            Sender.send(res, { success: true, data: friends, count, page, pages: Math.ceil(count / limit), status: 200 })
        } catch (error) {
            Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
    async getFriendsPendingApproval(req, res) {
        try {
            let limit = _.toInteger(req.query.limit);
            let page = _.toInteger(req.query.page);
            const friendsService = new FriendsService();
            let { friends, count } = await friendsService.findWithLimit({ userId: req.user.id, approved: false }, limit, page)
            Sender.send(res, { success: true, data: friends, count, page, pages: Math.ceil(count / limit), status: 200 })
        } catch (error) {
            Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
    async sendFriendRequest(req, res) {
        try {
            let body = {
                userId: req.user.id,
                friendId: req.body.friend,
                approved: false,
            }
            const friendsService = new FriendsService();
            let request = await friendsService.create(body);
            Sender.send(res, { success: true, data: request, status: 201, msg: "Friend request sent" })
        } catch (error) {
            Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
    async updateFriendRequest(req, res) {
        try {
            req.body.approved = req.body.approved == "true" ? true : false;
            const friendsService = new FriendsService();
            // Approve only requests made by the OTHER USER
            let getRequest = await friendsService.findOne({ id: req.params.id, friendId: req.user.id })
            if (getRequest == null) {
                Sender.errorSend(res, { success: false, status: 409, msg: "Something impossible happened" })
                return;
            }
            if (getRequest.approved == req.body.approved) {
                Sender.errorSend(res, { success: false, status: 409, msg: "Action already taken" })
                return;
            }
            let updateRequest = await friendsService.findOneAndUpdate({ id: req.params.id }, { approved: req.body.approved })
            Sender.send(res, { success: true, status: 200, msg: "Friend request updated", data: updateRequest })
        } catch (error) {
            Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
    async deleteFriendRequest(req, res) {
        try {
            const friendService = new FriendsService();
            let getRequest = await friendService.findOne({ id: req.params.id })
            if (getRequest == null || (getRequest.user.profile.userId != req.user.id && getRequest.user.profile.userId != req.user.id)) {
                Sender.errorSend(res, { success: false, status: 409, msg: "Something impossible happened" })
                return;
            }
            let deleteFriend = await friendService.delete({ id: req.params.id })
            Sender.send(res, { success: true, data: deleteFriend, msg: "Friend removed", status: 200 })
        } catch (error) {
            Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
    async getBlockList(req, res) {
        try {
            let limit = _.toInteger(req.query.limit);
            let page = _.toInteger(req.query.page);
            const blockedService = new BlockedService();
            let { blocked, count } = await blockedService.findWithLimit({ userId: req.user.id }, limit, page)
            Sender.send(res, { success: true, data: blocked, count, page, pages: Math.ceil(count / limit), status: 200 })
        } catch (error) {
            Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
    async blockUser(req, res) {
        try {
            let body = {
                userId: req.user.id,
                blockedId: req.body.user,
            }
            const friendService = new FriendsService();
            let orQuery = [
                { userId: req.user.id, friendId: req.body.user },
                { userId: req.body.user, friendId: req.user.id },
            ]
            let alreadyFriends = await friendService.find({ OR: orQuery })
            if (alreadyFriends.length != 0) { // Unfriending user
                await friendService.delete({ id: { in: alreadyFriends.map(x => x.id) } })
            }
            const blockedService = new BlockedService();
            let blocked = await blockedService.create(body);
            Sender.send(res, { success: true, data: blocked, status: 201, msg: "User blocked" })
        } catch (error) {
            Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
    async unblockUser(req, res) {
        try {
            const blockedService = new BlockedService();
            let getRequest = await blockedService.findOne({ id: req.params.id, userId: req.user.id })
            if (getRequest == null) {
                Sender.errorSend(res, { success: false, status: 409, msg: "Something impossible happened" })
                return;
            }
            let unblocked = await blockedService.delete({ id: req.params.id, userId: req.user.id })
            Sender.send(res, { success: true, data: unblocked, msg: "User unblocked", status: 200 })
        } catch (error) {
            Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
}
